package auth

import (
	"code.google.com/p/google-api-go-client/plus/v1"
	"encoding/base64"
	"encoding/gob"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	utils "github.com/jawr/dns/rest/util"
	"github.com/jawr/pgstore"
	"github.com/jawr/wall/config"
	"github.com/jawr/wall/database/models/users"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"log"
	"net/http"
	"strings"
	"time"
)

type httpHandler func(http.Handler) http.Handler

var sessionName string
var str *pgstore.Store

func init() {
	gob.Register(time.Now())
	gob.Register(users.User{})
}

var routes = utils.Routes{
	utils.Route{
		"Index",
		"GET",
		"/",
		Auth,
	},
	utils.Route{
		"Status",
		"GET",
		"/status/",
		Status,
	},
	utils.Route{
		"Logout",
		"POST",
		"/logout/",
		Logout,
	},
}

func Setup(router *mux.Router) {
	subRouter := router.PathPrefix("/auth").Subrouter()
	utils.SetupRouter(subRouter, "Auth", routes)
}

// Check just returns 200 and allows the client to check for headers
func Status(w http.ResponseWriter, r *http.Request) {
	session, err := GetSession(r)
	if err == nil {
		var u users.User
		if _u, ok := session.Values["user"]; ok {
			u = _u.(users.User)
			utils.ToJSON(u, nil, w)
			return
		}
	}
	w.WriteHeader(http.StatusOK)
}

// Destroy a session
func Logout(w http.ResponseWriter, r *http.Request) {
	session, err := GetSession(r)
	if err != nil {
		utils.Error(err, w)
		return
	}

	if t, ok := session.Values["expires"]; ok {
		if time.Now().Before(t.(time.Time)) {
			session.Options.MaxAge = -1

			if err := str.Save(r, w, session); err != nil {
				utils.Error(err, w)
				return
			}

			w.WriteHeader(http.StatusOK)
			return
		}
	}
	w.WriteHeader(http.StatusUnauthorized)
}

func Auth(w http.ResponseWriter, r *http.Request) {
	var params = r.URL.Query()
	var code = params.Get("code")
	if len(code) == 0 {
		utils.Error(errors.New("No code supplied for auth."), w)
		return
	}

	cfg := config.Get()
	clientID := cfg.GetString("google_client_id")
	clientSecret := cfg.GetString("google_client_secret")
	conf := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  "postmessage",
		Scopes: []string{
			"https://www.googleapis.com/auth/plus.login",
			"https://www.googleapis.com/auth/plus.profile.emails.read",
		},
		Endpoint: google.Endpoint,
	}

	tok, err := conf.Exchange(oauth2.NoContext, code)
	if err != nil {
		utils.Error(errors.New("Unable to exchange code for a token."), w)
		return
	}

	if !tok.Valid() {
		// 401
		utils.Error(errors.New("Invalid token."), w)
		return
	}

	client := conf.Client(oauth2.NoContext, tok)
	service, err := plus.New(client)
	if err != nil {
		utils.Error(errors.New("Unable to create a transport client."), w)
		return
	}

	gplusID, err := decodeIDToken(tok.Extra("id_token").(string))
	if err != nil {
		utils.Error(errors.New("Unable to decode ID Token."), w)
		return
	}

	people := service.People.Get(gplusID)
	person, err := people.Do()
	if err != nil {
		log.Println(err)
		utils.Error(errors.New("Unable to get Google Plus profile"), w)
		return
	}

	user, err := users.GetByID(person.Id)
	if err != nil {
		user, err = users.New(person.DisplayName, person.Id)
		if err != nil {
			log.Println(err)
			utils.Error(errors.New("Unable to create new user in the database"), w)
			return
		}
	}

	log.Printf("Person: %+v\n", person)
	// logged in
	session, err := GetSession(r)
	if err != nil {
		log.Println(err)
		utils.Error(errors.New("Unable to get session."), w)
		return
	}
	session.Values["expires"] = time.Now().Add(time.Hour * 24)
	session.Values["user"] = user
	session.Options.MaxAge = 86400 * 30

	if err := str.Save(r, w, session); err != nil {
		log.Println(err)
		utils.Error(errors.New("Unable to save session."), w)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func New(db *pgstore.Store) httpHandler {
	str = db
	cfg := config.Get()
	sessionName = cfg.GetString("session_name")
	return func(h http.Handler) http.Handler {
		return http.HandlerFunc(
			func(w http.ResponseWriter, r *http.Request) {
				session, err := GetSession(r)
				if err != nil {
					log.Println("no session.")
					utils.Error(err, w)
					return
				}
				if t, ok := session.Values["expires"]; ok {
					if time.Now().Before(t.(time.Time)) {
						// authed
						var u users.User
						if _u, ok := session.Values["user"]; ok {
							u = _u.(users.User)
							w.Header().Set("X-User", u.ID)
						}
						w.Header().Set("X-Expires", t.(time.Time).Format("2006-01-02T15:04:05"))
						h.ServeHTTP(w, r)
						return
					}
				}
				switch r.URL.Path {
				case "/api/v1/auth/", "/api/v1/auth/status/", "/api/v1/auth/logout/", "/api/v1/external/salesforce":
					h.ServeHTTP(w, r)
					return
				default:
					w.WriteHeader(http.StatusUnauthorized)
				}

			},
		)
	}
}

func GetSession(r *http.Request) (*sessions.Session, error) {
	session, err := str.Get(r, sessionName)
	if err != nil {
		session, err = str.New(r, sessionName)
		if err != nil {
			panic(err)
		}
	}
	return session, err
}

// ClaimSet represents an IdToken response.
type ClaimSet struct {
	Sub string
}

// decodeIdToken takes an ID Token and decodes it to fetch the Google+ ID within
func decodeIDToken(idToken string) (gplusID string, err error) {
	// An ID token is a cryptographically-signed JSON object encoded in base 64.
	// Normally, it is critical that you validate an ID token before you use it,
	// but since you are communicating directly with Google over an
	// intermediary-free HTTPS channel and using your Client Secret to
	// authenticate yourself to Google, you can be confident that the token you
	// receive really comes from Google and is valid. If your server passes the ID
	// token to other components of your app, it is extremely important that the
	// other components validate the token before using it.
	var set ClaimSet
	if idToken != "" {
		// Check that the padding is correct for a base64decode
		parts := strings.Split(idToken, ".")
		if len(parts) < 2 {
			return "", fmt.Errorf("Malformed ID token")
		}
		// Decode the ID token
		b, err := base64Decode(parts[1])
		if err != nil {
			return "", fmt.Errorf("Malformed ID token: %v", err)
		}
		err = json.Unmarshal(b, &set)
		if err != nil {
			return "", fmt.Errorf("Malformed ID token: %v", err)
		}
	}
	return set.Sub, nil
}

func base64Decode(s string) ([]byte, error) {
	// add back missing padding
	switch len(s) % 4 {
	case 2:
		s += "=="
	case 3:
		s += "="
	}
	return base64.URLEncoding.DecodeString(s)
}
