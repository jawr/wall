package rest

import (
	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"github.com/jawr/pgstore"
	"github.com/jawr/wall/config"
	"github.com/jawr/wall/database/connection"
	"github.com/jawr/wall/rest/auth"
	"github.com/jawr/wall/rest/links"
	"log"
	"net/http"
)

func Start() error {
	cfg := config.Get()
	key := cfg.GetString("session_secret")

	connStr := connection.CreateConnectionString()
	sessionDB := pgstore.NewStore(connStr, []byte(key))
	defer sessionDB.Close()
	sessionDB.Options = &sessions.Options{
		Path: "/",
	}

	router := mux.NewRouter()
	sub := router.PathPrefix("/api/v1").Subrouter()
	links.Setup(sub)
	auth.Setup(sub)

	authoriser := auth.New(sessionDB)
	h := authoriser(router)

	log.Println("Starting rest service...")
	err := http.ListenAndServe("127.0.0.1:8100", h)
	log.Println("Stoping rest service...")
	return err
}
