package users

import (
	"encoding/json"
	"github.com/jawr/wall/database/connection"
	"github.com/jawr/wall/utils"
)

type Permissions struct {
	IsAdmin bool `json:"is_admin"`
}

type User struct {
	Name        string      `json:"name"`
	ID          string      `json:"id"`
	Permissions Permissions `json:"permissions"`
}

func New(name string, id string) (user User, err error) {
	user.Name = name
	user.ID = id
	err = user.Save()
	return
}

func (u User) Save() (err error) {
	conn, err := connection.Get()
	if err != nil {
		return
	}
	_, err = conn.Exec("INSERT INTO users (id, name, permissions) VALUES ($1, $2, $3)",
		u.ID,
		u.Name,
		utils.ToJSON(u.Permissions),
	)
	if err != nil {
		// attempt to update
		_, err = conn.Exec("UPDATE users SET permissions = $1 WHERE id = $2", utils.ToJSON(u.Permissions), u.ID)
	}
	return
}

func GetByID(id string) (user User, err error) {
	conn, err := connection.Get()
	if err != nil {
		return
	}
	user.ID = id
	var permissions []byte
	err = conn.QueryRow("SELECT name, permissions FROM users WHERE id = $1", id).Scan(&user.Name, &permissions)
	if err != nil {
		return
	}
	err = json.Unmarshal(permissions, &user.Permissions)
	return
}

func GetAll() (users []User, err error) {
	conn, err := connection.Get()
	if err != nil {
		return
	}
	rows, err := conn.Query("SELECT id, name, permissions FROM users ORDER BY name ASC")
	if err != nil {
		return
	}
	defer rows.Close()
	for rows.Next() {
		var user User
		var permissions []byte
		err = rows.Scan(&user.ID, &user.Name, &permissions)
		if err != nil {
			return users, err
		}
		err = json.Unmarshal(permissions, &user.Permissions)
		if err != nil {
			return users, err
		}
		users = append(users, user)
	}
	err = rows.Err()
	return
}
