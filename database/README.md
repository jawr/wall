## Models

### Link
This is the actual meat of the program. Where all meta data associated with the link is stored.

```
type Link struct {
	ID int

	User user

	URL string

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

