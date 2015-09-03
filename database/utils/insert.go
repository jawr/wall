package utils

import (
	"encoding/json"
	"fmt"
	"github.com/jawr/wall/database/connection"
	"reflect"
	"strings"
)

func Insert(o Object) (err error) {
	v := reflect.ValueOf(o)
	if v.Kind() == reflect.Interface && !v.IsNil() {
		elm := v.Elem()
		if elm.Kind() == reflect.Ptr && !elm.IsNil() && elm.Elem().Kind() == reflect.Ptr {
			v = elm
		}
	}
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	var id, idIdx int

	values := []interface{}{}
	fields := []string{}
	placeholders := []string{}
	getID := false

	for i := 0; i < v.NumField(); i++ {
		valueField := v.Field(i)
		if valueField.Kind() == reflect.Ptr && valueField.IsNil() {
			continue
		}
		typeField := v.Type().Field(i)
		tag := typeField.Tag
		if tag.Get("json") == "id" {
			getID = true
			idIdx = i
			continue
		} else if strings.HasSuffix(tag.Get("json"), "_id") {
			if tag.Get("pg_type") != "raw" {
				// get embedded object id
				if reflect.Struct == valueField.Kind() {
					values = append(values, valueField.FieldByName("ID").Interface())
				}
			}
		} else if tag.Get("pg_type") == "-" {
			continue
		} else if tag.Get("pg_type") == "jsonb" {
			b, err := json.Marshal(valueField.Interface())
			if err != nil {
				return err
			}
			values = append(values, &b)
		} else {
			values = append(values, valueField.Interface())
		}
		fields = append(fields, tag.Get("json"))
		placeholders = append(
			placeholders,
			fmt.Sprintf("$%d", len(values)),
		)
	}

	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)",
		o.Table(),
		strings.Join(fields, ","),
		strings.Join(placeholders, ","),
	)

	conn, err := connection.Get()
	if err != nil {
		return
	}

	if getID {
		query = query + " RETURNING id"
		err = conn.QueryRow(query, values...).Scan(&id)
		f := v.FieldByIndex([]int{idIdx})
		if f.CanSet() {
			f.SetInt(int64(id))
		}

	} else {
		_, err = conn.Exec(query, values...)

	}
	return
}
