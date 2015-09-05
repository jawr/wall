package links

import (
	"github.com/PuerkitoBio/goquery"
	"golang.org/x/net/html"
	"net/http"
	"strings"
)

/*
	we need to look for meta tags as these are explicitly set descriptions/images that have
	been set by the creator


*/

func (c *Link) Parse() (err error) {
	if strings.Contains(c.URL, "play.spotify") {
		c.URL = strings.Replace(c.URL, "play.spotify", "open.spotify", 1)
	}

	doc, err := goquery.NewDocument(c.URL)
	if err != nil {
		return
	}

	doc.Find(`meta`).Each(func(i int, s *goquery.Selection) {
		if prop, ok := s.Attr("name"); ok {
			if content, ok := s.Attr("content"); ok {
				switch prop {
				case "title":
					c.Title = content
				case "description":
					c.Meta.Excerpt = content
				case "image":
					c.Meta.Image = content
				}
			}
		}
		if prop, ok := s.Attr("property"); ok {
			if content, ok := s.Attr("content"); ok {
				switch prop {
				case "og:title", "title":
					c.Title = content
				case "og:description":
					c.Meta.Excerpt = content
				case "og:image":
					c.Meta.Image = content
				}
			}
		}
	})
	if len(c.Title) == 0 || len(c.Meta.Excerpt) == 0 {
		return c.GenerateExcerpt()
	}
	return
}

func (c *Link) GenerateExcerpt() (err error) {
	resp, err := http.Get(c.URL)
	if err != nil {
		return
	}

	doc, err := html.Parse(resp.Body)
	if err != nil {
		return
	}

	// define our optimal minimum size, search until we find this or the next largest
	var getExcerpt bool
	var currentExcerpt string
	if len(c.Meta.Excerpt) == 0 {
		getExcerpt = true
	}

	// maybe change isText to parent node
	var f func(*html.Node, bool)
	f = func(n *html.Node, isText bool) {
		if n == nil {
			return
		}
		if n.Type == html.ElementNode && len(c.Title) == 0 {
			child := n.FirstChild
			switch n.Data {
			case "title":
				if child != nil && child.Type == html.TextNode {
					c.Title = child.Data
				}
			}
		}

		if isText && getExcerpt {
			data := strings.ToLower(n.Data)
			if strings.Contains(n.Data, "{") && strings.Contains(n.Data, "}") {
			} else if strings.Contains(n.Data, "document.") {
			} else if strings.Contains(data, "browser") && strings.Contains(data, "supported") {
				// browser not supported, stop looking
				getExcerpt = false
				c.Meta.Excerpt = ""
			} else if strings.Contains(n.Data, "window.") {
			} else if strings.Contains(n.Data, "function") && strings.Contains(n.Data, "(") {
			} else if strings.Contains(n.Data, "var ") && strings.Contains(n.Data, "=") {
			} else if strings.Contains(n.Data, "<") && (strings.Contains(n.Data, "</") || strings.Contains(n.Data, "/>")) {
			} else if len(c.Meta.Excerpt) == 0 {
				if len(n.Data) > 200 && len(c.Meta.Excerpt) == 0 {
					c.Meta.Excerpt = n.Data
				} else if len(n.Data) > len(currentExcerpt) && len(c.Meta.Excerpt) == 0 {
					currentExcerpt = n.Data
				}
			}
		}

		isText = isText || (n.Type == html.ElementNode && (n.Data == "span" ||
			n.Data == "div" ||
			n.Data == "p"))

		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c, isText)
		}
	}
	f(doc, false)

	// check optimal
	if len(c.Meta.Excerpt) == 0 {
		c.Meta.Excerpt = currentExcerpt
	}
	return
}
