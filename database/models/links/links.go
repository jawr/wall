package links

import (
	"encoding/json"
	"fmt"
	"github.com/jawr/wall/database/connection"
	"github.com/jawr/wall/database/models/tags"
	"github.com/jawr/wall/database/models/users"
	"github.com/jawr/wall/database/utils"
	"time"
)

type Meta struct {
	Excerpt string `json:"excerpt"`
	Image   string `json:"image"`
}

type Link struct {
	ID    int        `json:"id"`
	User  users.User `json:"user_id"`
	Title string     `json:"title"`
	URL   string     `json:"url"`

	AddedAt      *time.Time `json:"added_at"`
	LastViewedAt *time.Time `json:"last_viewed_at"`

	Viewed     bool `json:"viewed"`
	Meta       Meta `json:"meta" pg_type:"jsonb"`
	ClickCount int  `json:"click_count"`

	Tags tags.Tags `json:"tags" pg_type:"-"`
}

func (c Link) Table() string {
	return "links"
}

func (c Link) PKeys() []string {
	return []string{
		"id",
	}
}

func (c Link) IsValid() bool {
	return c.ID > 0
}

func (c *Link) Save() (err error) {
	err = utils.Save(c)
	return
}

func (c *Link) Insert() (err error) {
	err = c.Parse()
	if err != nil {
		return
	}
	return utils.Insert(c)
}

func (c *Link) AddTag(tag string) (err error) {
	return c.Tags.Add(c.ID, tag)
}

func (c *Link) RemoveTag(tag string) (err error) {
	return c.Tags.Remove(c.ID, tag)
}

func (c *Link) LoadTags() (err error) {
	c.Tags, err = tags.Load(c.ID)
	return
}

const (
	SELECT string = `
		SELECT 
			id,
			user_id,
			title,
			url,
			added_at,
			last_viewed_at,
			viewed,
			meta,
			tags,
			click_count 
		FROM links `
)

func (c *Link) Load() (err error) {
	var list []Link
	if c.ID != 0 {
		list, err = GetByID(c.ID)
	} else {
		list, err = GetByTitle(c.Title)
	}

	if err != nil {
		return
	} else if len(list) == 0 {
		return fmt.Errorf("No results returned when trying to load Link.")
	} else if len(list) > 1 {
		return fmt.Errorf("Too many results returned when trying to load Link.")
	}

	*c = list[0]

	return
}

func get(query string, args ...interface{}) (list []Link, err error) {
	err = utils.GetList(parseRow, func(raw []interface{}) {
		list = make([]Link, len(raw))
		for idx, o := range raw {
			list[idx] = o.(Link)
		}
	}, query, args...)
	return
}

func parseRow(row utils.Row) (interface{}, error) {
	var o Link
	var userID string
	var meta, tags []byte
	err := row.Scan(
		&o.ID,
		&userID,
		&o.Title,
		&o.URL,
		&o.AddedAt,
		&o.LastViewedAt,
		&o.Viewed,
		&meta,
		&tags,
		&o.ClickCount,
	)
	if err != nil {
		return o, err
	}
	err = json.Unmarshal(meta, &o.Meta)
	if err != nil {
		return o, err
	}
	err = json.Unmarshal(tags, &o.Tags)
	if err != nil {
		return o, err
	}
	o.User, err = users.GetByID(userID)
	if err != nil {
		return o, err
	}
	err = o.LoadTags()
	return o, err
}

func GetByID(id int) (list []Link, err error) {
	return get(SELECT+"WHERE id = $1", id)
}

func GetByTitle(title string) (list []Link, err error) {
	return get(SELECT+"WHERE title = $1", title)
}

func Search(user users.User, query string) (list []Link, err error) {
	return get(
		SELECT+"WHERE title ILIKE $1 AND user_id = $2 ORDER BY id DESC",
		query,
		user.ID,
	)
}

func GetAll() (list []Link, err error) {
	return get(SELECT + "ORDER BY id DESC")
}

func (c *Link) IncrClickCount() (err error) {
	conn, err := connection.Get()
	if err != nil {
		return err
	}
	_, err = conn.Exec("UPDATE links SET click_count = click_count + 1, viewed = true, last_viewed_at =CURRENT_TIMESTAMP WHERE id = $1", c.ID)
	return
}

func (c *Link) Delete() (err error) {
	conn, err := connection.Get()
	if err != nil {
		return err
	}
	_, err = conn.Exec("DELETE FROM links WHERE id = $1", c.ID)
	return
}
