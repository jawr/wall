package main

import (
	"github.com/jawr/wall/database/models/links"
	"github.com/jawr/wall/database/utils"
	"github.com/jawr/wall/rest"
	"log"
)

func main() {
	err := rest.Start()
	if err != nil {
		panic(err)
	}
}

func testModels() {
	link := links.Link{
		Title: "Test link",
		URL:   "https://jess.lawrence.pm",
	}
	err := link.Save()
	if err != nil {
		panic(err)
	}
	log.Println(link)

	link.Title = "test link name change"
	err = link.Save()
	if err != nil {
		panic(err)
	}
	log.Println(link)

	err = utils.Insert(&link)
	if err != nil {
		panic(err)
	}

	err = link.AddTag("tag1")
	if err != nil {
		panic(err)
	}

	err = link.AddTag("tag2")
	if err != nil {
		panic(err)
	}

	err = link.RemoveTag("tag1")
	if err != nil {
		panic(err)
	}

	log.Println(link.Tags)
}
