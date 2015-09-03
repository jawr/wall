package queries

import (
	"fmt"
	"github.com/jawr/tb/database/connection"
	"reflect"
	"strings"
)

type Object interface {
	Table() string
}

func Insert(o Object) (err error) {
	v := reflect.ValueOf(o)

	values := make([]interface{}, v.NumField())
	fields := make([]string, v.NumField())
	placeholders := make([]string, v.NumField())

	for i := 0; i < v.NumField(); i++ {
		valueField := v.Field(i)
		typeField := v.Type().Field(i)
		tag := typeField.Tag
		fields[i] = tag.Get("json")
		values[i] = valueField.Interface()
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}

	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)\n",
		o.Table(),
		strings.Join(fields, ","),
		strings.Join(placeholders, ","),
	)

	conn, err := connection.Get()
	if err != nil {
		return
	}

	_, err = conn.Exec(query, values...)
	return
}

func Select(o Object, results interface{}) (err error) {
	v := reflect.ValueOf(o)

	values := make([]*reflect.StructField, v.NumField())
	fields := make([]string, v.NumField())
	placeholders := make([]string, v.NumField())

	for i := 0; i < v.NumField(); i++ {
		typeField := v.Type().Field(i)
		values[i] = &typeField
		tag := typeField.Tag
		fields[i] = tag.Get("json")
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}

	query := fmt.Sprintf("SELECT %s FROM %s\n",
		strings.Join(fields, ","),
		o.Table(),
	)

	t := reflect.TypeOf(o)

	conn, err := connection.Get()
	if err != nil {
		return
	}
	rows, err := conn.Query(query)
	if err != nil {
		return
	}

	resultsValue := reflect.Indirect(reflect.ValueOf(results))
	for rows.Next() {
		i := reflect.New(t)
		dest := make([]interface{}, len(fields))
		for idx, value := range values {
			f := i.Elem().FieldByName(value.Name)
			target := f.Addr().Interface()
			dest[idx] = target
		}
		err = rows.Scan(dest...)
		resultsValue.Set(reflect.Append(resultsValue, i.Elem()))
	}
	err = rows.Err()
	return
}
