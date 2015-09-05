package links

import (
	"encoding/json"
	"errors"
	"github.com/gorilla/mux"
	"github.com/jawr/dns/rest/paginator"
	"github.com/jawr/dns/rest/util"
	db "github.com/jawr/wall/database/models/links"
	"github.com/jawr/wall/database/models/users"
	"github.com/jawr/wall/rest/auth"
	"log"
	"net/http"
	"net/url"
)

var routes = util.Routes{
	util.Route{
		"Search",
		"GET",
		"/",
		paginator.Paginate(Search),
	},
	util.Route{
		"Create",
		"POST",
		"/",
		Create,
	},
	util.Route{
		"Save",
		"PUT",
		"/",
		Save,
	},
	util.Route{
		"AddTag",
		"POST",
		"/{id}/tags",
		GetByID(AddTag),
	},
	util.Route{
		"RemoveTag",
		"DELETE",
		"/{id}/tags",
		GetByID(RemoveTag),
	},
	util.Route{
		"IncrClickCount",
		"POST",
		"/{id}/incrClickCount",
		GetByID(IncrClickCount),
	},
	util.Route{
		"Refresh",
		"POST",
		"/{id}/refresh",
		GetByID(Refresh),
	},
	util.Route{
		"DeleteExcerptByID",
		"DELETE",
		"/{id}/excerpt",
		GetByID(DeleteExcerpt),
	},
	util.Route{
		"DeleteByID",
		"DELETE",
		"/{id}/",
		GetByID(Delete),
	},
	util.Route{
		"GetByID",
		"GET",
		"/{id}/",
		GetByID(serve),
	},
	util.Route{
		"RedirectByID",
		"GET",
		"/{id}/redirect",
		GetByID(Redirect),
	},
}

func Setup(router *mux.Router) {
	subRouter := router.PathPrefix("/links").Subrouter()
	util.SetupRouter(subRouter, "Link", routes)
}

func Search(w http.ResponseWriter, r *http.Request, params url.Values, limit, offset int) {
	session, err := auth.GetSession(r)
	if err != nil {
		util.Error(err, w)
		return
	}
	userID := r.URL.Query().Get("user_id")
	if len(userID) > 0 {
		user, err := users.GetByID(userID)
		if err != nil {
			util.Error(err, w)
			return
		}
		query := r.URL.Query().Get("query")
		res, err := db.Search(user, query)
		util.ToJSON(res, err, w)
		return
	} else {
		var user users.User
		if u, ok := session.Values["user"]; ok {
			user = u.(users.User)
			log.Println(user)
			query := r.URL.Query().Get("query")
			res, err := db.Search(user, query)
			util.ToJSON(res, err, w)
			return
		}
	}
	util.Error(errors.New("Unable to get session"), w)
}

func Create(w http.ResponseWriter, r *http.Request) {
	var o db.Link
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&o)
	if err != nil {
		util.Error(err, w)
		return
	}
	err = o.Insert()
	if err != nil {
		util.Error(err, w)
		return
	}
	err = o.Load()
	if err != nil {
		util.Error(err, w)
		return
	}
	linkURL, err := url.Parse(o.URL)
	if err != nil {
		util.Error(err, w)
		return
	}
	err = o.AddTag(linkURL.Host)
	util.ToJSON(o, err, w)
}

func Save(w http.ResponseWriter, r *http.Request) {
	var o db.Link
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&o)
	if err != nil {
		util.Error(err, w)
		return
	}
	err = o.Save()
	if err != nil {
		util.Error(err, w)
		return
	}
	err = o.Load()
	util.ToJSON(o, err, w)
}

func Delete(w http.ResponseWriter, r *http.Request, res []db.Link) {
	err := res[0].Delete()
	util.ToJSON(true, err, w)
}

func DeleteExcerpt(w http.ResponseWriter, r *http.Request, res []db.Link) {
	res[0].Meta.Excerpt = ""
	err := res[0].Save()
	util.ToJSON(res[0], err, w)
}

func IncrClickCount(w http.ResponseWriter, r *http.Request, res []db.Link) {
	err := res[0].IncrClickCount()
	util.ToJSON(res[0], err, w)
}

func AddTag(w http.ResponseWriter, r *http.Request, res []db.Link) {
	var tag string
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&tag)
	if err != nil {
		util.Error(err, w)
		return
	}
	err = res[0].AddTag(tag)
	util.ToJSON(res[0], err, w)
}

func RemoveTag(w http.ResponseWriter, r *http.Request, res []db.Link) {
	var tag string
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&tag)
	if err != nil {
		util.Error(err, w)
		return
	}
	err = res[0].RemoveTag(tag)
	util.ToJSON(res[0], err, w)
}

func Refresh(w http.ResponseWriter, r *http.Request, res []db.Link) {
	err := res[0].Parse()
	if err != nil {
		util.Error(err, w)
		return
	}
	err = res[0].Save()
	util.ToJSON(res[0], err, w)
}

func Redirect(w http.ResponseWriter, r *http.Request, res []db.Link) {
	res[0].IncrClickCount()
	http.Redirect(w, r, res[0].URL, http.StatusSeeOther)
}

func GetByID(fn func(http.ResponseWriter, *http.Request, []db.Link)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		res, err := db.GetByID(util.ParseInt(vars["id"]))
		if err != nil {
			util.Error(err, w)
			return
		}
		fn(w, r, res)
	}
}

func serve(w http.ResponseWriter, r *http.Request, res []db.Link) {
	util.ToJSON(res, nil, w)
}
