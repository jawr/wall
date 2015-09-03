package utils

import (
	"database/sql"
	"github.com/jawr/wall/database/connection"
)

type Object interface {
	Table() string
	PKeys() []string
	IsValid() bool
	Load() error
}

// Row is an interface that allows us to pass sql.Rows and sql.Row to our model specific
// parseRow functions.
type Row interface {
	Scan(dest ...interface{}) error
}

var NotFound = sql.ErrNoRows

func Upsert(o Object) (err error) {
	if !o.IsValid() {
		err = Insert(o)
		if err == nil {
			return
		}
		// get by name
		err = o.Load()
		if err != nil {
			return
		}
	}
	err = Update(o)
	return
}

func Save(o Object) (err error) {
	err = Update(o)
	return
}

func Delete(o Object) (err error) {
	return
}

type ParseRow func(Row) (interface{}, error)
type SetFn func([]interface{})

func GetList(parseRow ParseRow, fn SetFn, query string, args ...interface{}) (err error) {
	conn, err := connection.Get()
	if err != nil {
		return
	}
	rows, err := conn.Query(query, args...)
	if err != nil {
		return
	}
	defer rows.Close()
	var list []interface{}
	for rows.Next() {
		rt, err := parseRow(rows)
		if err != nil {
			return err
		}
		list = append(list, rt)
	}
	if err != nil {

		err = rows.Err()
	}

	fn(list)
	return
}
