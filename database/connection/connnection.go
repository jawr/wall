// Package connection is a singleton object used to connect to a Postgres instance. The package
// relies on a config.json file to read it's globals from.
package connection

import (
	"database/sql"
	"fmt"
	"github.com/jawr/wall/config"
	_ "github.com/lib/pq"
)

// Row is an interface that allows us to pass sql.Rows and sql.Row to our model specific
// parseRow functions.
type Row interface {
	Scan(dest ...interface{}) error
}

// Our singleton.
type connection struct {
	db *sql.DB
}

var single *connection = nil

// Get attempts to setup our connection, if already setup it checks if still alive and
// then attempts to retrieve a connection.
//
// Warning, this method can panic (call to setup).
func Get() (*sql.DB, error) {
	if single == nil {
		single = new(connection)
		if err := single.setup(); err != nil {
			return single.db, err
		}
	}
	err := single.db.Ping()
	if err != nil {
		if err := single.setup(); err != nil {
			return single.db, err
		}
	}
	return single.db, nil
}

// create connection string uses config.json to create a conenction string. Warning, can panic
func CreateConnectionString() string {
	cfg := config.Get()
	user := cfg.GetString("db_pg_user")
	pass := cfg.GetString("db_pg_pass")
	name := cfg.GetString("db_pg_name")
	host := cfg.GetString("db_pg_host")
	port := cfg.GetInt("db_pg_port")
	if len(user+pass+name) == 0 {
		panic("error setup config file for database connection")
	}
	connStr := fmt.Sprintf("user=%s password=%s dbname=%s sslmode=disable",
		user,
		pass,
		name,
	)
	if len(host) > 0 {
		connStr += fmt.Sprintf(" host=%s", host)
	}
	if port > 0 {
		connStr += fmt.Sprintf(" port=%d", port)
	}
	return connStr
}

// setup uses CreateConnectionString to try and connect to Postgres. Warning, this method can panic.
func (c *connection) setup() error {
	connStr := CreateConnectionString()
	conn, err := sql.Open("postgres", connStr)
	if err != nil {
		panic(err)
	}
	c.db = conn
	return nil
}
