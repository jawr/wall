### Design
Wall is a standalone website that allows you to save links and display them in an incredibly readable way. It's a useful place to store 'read later' articles, or articles you may want to revist. It's a place you can store favourite videos and music tracks.

#### Models

##### Cateogry
Category is a way of grouping sub categories and allows you to manage your links better.

```
type Category struct {
	ID int
	Name string
}

category := Category{
	ID: 1,
	Name: "Media",
}
```

##### Sub Category
This is a more explicit bucket for your links.

```
type SubCategory struct {
	ID int
	Category Category
	Name string
}

subCategory := SubCategory{
	ID: 1,
	Category: category,
	Name: "Videos",
}
```

##### Link
This is the actual meat of the program. Where all meta data associated with the link is stored.

```
type Link struct {
	URL string
	SubCategory SubCategory

	// User added tags to help organise links
	Tags []string

	// Any adhoc information can be stored in here
	Meta json.RawMessage
	
	// Information about the creation of the link
	AddedAt time.Time

	// Some information about when we last interacted with the Link
	Viewed bool
	LastViewedAt time.Time
	ClickCount int
}
```
