package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
)

var database *sql.DB

type leader struct {
	Id    int
	Name  string
	Score int
}

func init() {
	db, err := sql.Open("mysql", "root:mysql@tcp(mysql_db:3306)/leaderboard")
	if err != nil {
		log.Println(err)
	}
	_, errCreate := db.Exec("CREATE TABLE IF NOT EXISTS leaders (Id INT AUTO_INCREMENT PRIMARY KEY,Name VARCHAR(40),Score INT)")
	if errCreate != nil {
		panic(errCreate)
	}

	database = db

}

type Data struct {
	Name string `json:"Name"`
}
type ResponseData struct {
	Score int `json:"BestScore"`
}

type LeaderData struct {
	Name  string `json:"Name"`
	Score int    `json:"Score"`
}

func GetScore(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	var data Data
	err = json.Unmarshal(body, &data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	name := data.Name
	var BestScore int
	errScore := database.QueryRow("select Score from leaders where Name = ?", name).Scan(&BestScore)
	if errScore != nil {
		if errScore == sql.ErrNoRows {
			database.Exec("insert into leaders (Name,Score) values (?,0)", name)
		}
	}

	respData := ResponseData{
		Score: BestScore,
	}
	jsonData, err := json.Marshal(respData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)

}

func UpdateScore(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	var data LeaderData
	err = json.Unmarshal(body, &data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	name, score := data.Name, data.Score
	var BestScore int
	errScore := database.QueryRow("select Score from leaders where Name = ?", name).Scan(&BestScore)
	if errScore != nil {
		panic(errScore)
	}
	if score > BestScore {
		database.Exec("update leaders set Score = ? where Name =?", score, name)
	}

}
func IndexHandler(w http.ResponseWriter, r *http.Request) {

	rows, err := database.Query("select * from leaders order by score desc")
	if err != nil {
		log.Println(err)
	}
	defer rows.Close()
	leaders := []leader{}

	for rows.Next() {
		l := leader{}
		err := rows.Scan(&l.Id, &l.Name, &l.Score)
		if err != nil {
			fmt.Println(err)
			continue
		}
		leaders = append(leaders, l)
	}
	tmpl, _ := template.ParseFiles("static/leaderboard.html")
	errEx := tmpl.Execute(w, leaders)
	if errEx != nil {
		return
	}
}

func main() {
	defer database.Close()

	http.HandleFunc("/api/getscore/", GetScore)
	http.HandleFunc("/api/updatescore/", UpdateScore)
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/index.html")
	})
	http.HandleFunc("/leaderboard", IndexHandler)
	err := http.ListenAndServe(":7777", nil)
	if err != nil {
		panic(err)
	}
	fmt.Println("Server started")
}
