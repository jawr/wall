package tags

import (
	"github.com/jawr/wall/database/connection"
)

type Tag struct {
	ID   int    `json:"-"`
	Name string `json:"name"`
}

func getByName(name string) (tag Tag, err error) {
	tag.Name = name
	conn, err := connection.Get()
	if err != nil {
		return
	}
	err = conn.QueryRow("SELECT id, name FROM tags WHERE name = $1", name).Scan(&tag.ID, &tag.Name)
	if err == nil {
		return
	}
	err = conn.QueryRow("INSERT INTO tags (name) VALUES ($1) RETURNING id", name).Scan(&tag.ID)
	return
}

func getByID(id int) (tag Tag, err error) {
	conn, err := connection.Get()
	if err != nil {
		return
	}
	err = conn.QueryRow("SELECT id, name FROM tags WHERE id = $1", id).Scan(&tag.ID, &tag.Name)
	return
}

type Tags []Tag

func (t *Tags) Add(id int, name string) (err error) {
	tag, err := getByName(name)
	if err != nil {
		return
	}
	conn, err := connection.Get()
	if err != nil {
		return
	}
	_, err = conn.Exec("INSERT INTO link_tags (tag_id, link_id) VALUES ($1, $2)", tag.ID, id)
	if err != nil {
		return
	}
	*t = append(*t, tag)
	return
}

func (t *Tags) Remove(id int, name string) (err error) {
	tag, err := getByName(name)
	if err != nil {
		return
	}
	conn, err := connection.Get()
	if err != nil {
		return
	}
	_, err = conn.Exec("DELETE FROM link_tags WHERE tag_id = $1 AND link_id = $2", tag.ID, id)
	slice := *t
	for idx, i := range slice {
		if i.Name == name {
			slice = append(slice[:idx], slice[idx+1:]...)
			break
		}
	}
	*t = slice
	return
}

func Load(id int) (all Tags, err error) {
	conn, err := connection.Get()
	if err != nil {
		return
	}
	rows, err := conn.Query("SELECT tag_id FROM link_tags WHERE link_id = $1", id)
	if err != nil {
		return
	}
	defer rows.Close()
	for rows.Next() {
		var tagID int
		err = rows.Scan(&tagID)
		if err != nil {
			return
		}
		tag, err := getByID(tagID)
		if err != nil {
			return all, err
		}
		all = append(all, tag)
	}
	err = rows.Err()
	return
}
