package utils

import (
	"encoding/json"
	"fmt"
	"github.com/jawr/wall/database/connection"
	"reflect"
	"strings"
)

type WhereArg struct {
	Field       string
	Placeholder string
}

// Takes an Object and a list of primary keys and attempts to update the Object
// based on the keys
func Update(o Object) (err error) {
	pkeys := o.PKeys()
	if len(pkeys) <= 0 {
		panic("Must provide at least one Primary Key")
	}

	v := reflect.ValueOf(o)

	values := []interface{}{}
	fields := []string{}
	placeholders := []string{}
	where := []WhereArg{}

	// deref
	if v.Kind() == reflect.Interface && !v.IsNil() {
		elm := v.Elem()
		if elm.Kind() == reflect.Ptr && !elm.IsNil() && elm.Elem().Kind() == reflect.Ptr {
			v = elm
		}
	}
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	for i := 0; i < v.NumField(); i++ {
		valueField := v.Field(i)
		if valueField.Kind() == reflect.Ptr && valueField.IsNil() {
			continue
		}
		typeField := v.Type().Field(i)
		tag := typeField.Tag
		// check pkeys
		pkey := false
		for _, k := range pkeys {
			if k == tag.Get("json") {
				pkey = true
				break
			}
		}

		// if we have a pkey update the where array
		placeholder := len(values)
		if pkey {
			arg := WhereArg{
				Field:       tag.Get("json"),
				Placeholder: fmt.Sprintf("$%d", placeholder+1),
			}
			where = append(where, arg)
		} else if tag.Get("pg_type") == "-" {
			continue
		} else {
			fields = append(fields, tag.Get("json"))
			placeholders = append(placeholders, fmt.Sprintf("$%d", placeholder+1))
		}

		if strings.HasSuffix(tag.Get("json"), "_id") {
			// get embedded object id
			if reflect.Struct == valueField.Kind() {
				values = append(values, valueField.FieldByName("ID").Interface())
			}
		} else if tag.Get("pg_type") == "jsonb" {
			b, err := json.Marshal(valueField.Interface())
			if err != nil {
				return err
			}
			values = append(values, &b)
		} else {
			values = append(values, valueField.Interface())
		}
	}

	setArgs := []string{}
	for idx, _ := range fields {
		setArgs = append(
			setArgs,
			fmt.Sprintf("%s = %s",
				fields[idx],
				placeholders[idx],
			),
		)
	}

	whereArgs := []string{}
	for _, arg := range where {
		whereArgs = append(
			whereArgs,
			fmt.Sprintf("%s = %s",
				arg.Field,
				arg.Placeholder,
			),
		)
	}

	query := fmt.Sprintf(
		"UPDATE %s SET %s WHERE %s",
		o.Table(),
		strings.Join(setArgs, ", "),
		strings.Join(whereArgs, ", "),
	)

	fmt.Println(query)
	fmt.Println(values)

	conn, err := connection.Get()
	if err != nil {
		return
	}

	_, err = conn.Exec(query, values...)
	return
}
