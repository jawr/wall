package links

import (
	"golang.org/x/net/html"
	"net/http"
	"strings"
)

func (c *Link) Parse() (err error) {
	resp, err := http.Get(c.URL)
	if err != nil {
		return
	}

	doc, err := html.Parse(resp.Body)
	if err != nil {
		return
	}

	// define our optimal minimum size, search until we find this or the next largest
	c.Meta.Excerpt = ""
	var currentExcerpt string

	// maybe change isText to parent node
	var f func(*html.Node, bool)
	f = func(n *html.Node, isText bool) {
		if n == nil {
			return
		}
		if n.Type == html.ElementNode {
			child := n.FirstChild
			switch n.Data {
			case "title":
				if child != nil && child.Type == html.TextNode {
					c.Title = child.Data
				}
			}
		}

		if isText {
			if strings.Contains(n.Data, "{") && strings.Contains(n.Data, "}") {
			} else if strings.Contains(n.Data, "document.") {
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
