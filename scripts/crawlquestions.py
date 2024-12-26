
from bs4 import BeautifulSoup
import requests
import json
from collections import defaultdict

SOURCE_URLS = [
    "https://www.cl.cam.ac.uk/teaching/1112/part1a-cst.html",
    "https://www.cl.cam.ac.uk/teaching/1112/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/1112/part2.html",
    "https://www.cl.cam.ac.uk/teaching/1112/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1213/part1a-cst.html",
    "https://www.cl.cam.ac.uk/teaching/1213/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/1213/part2.html",
    "https://www.cl.cam.ac.uk/teaching/1213/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1314/part1a-cst.html",
    "https://www.cl.cam.ac.uk/teaching/1314/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/1314/part2.html",
    "https://www.cl.cam.ac.uk/teaching/1314/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1415/part1a-cst.html",
    "https://www.cl.cam.ac.uk/teaching/1415/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/1415/part2.html",
    "https://www.cl.cam.ac.uk/teaching/1415/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1516/part1a-cst.html",
    "https://www.cl.cam.ac.uk/teaching/1516/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/1516/part2.html",
    "https://www.cl.cam.ac.uk/teaching/1516/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1617/part1a-75.html",
    "https://www.cl.cam.ac.uk/teaching/1617/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/1617/part2.html",
    "https://www.cl.cam.ac.uk/teaching/1617/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1718/part1a-75.html",
    "https://www.cl.cam.ac.uk/teaching/1718/part1b-75.html",
    "https://www.cl.cam.ac.uk/teaching/1718/part2.html",
    "https://www.cl.cam.ac.uk/teaching/1718/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1819/part1a-75.html",
    "https://www.cl.cam.ac.uk/teaching/1819/part1b-75.html",
    "https://www.cl.cam.ac.uk/teaching/1819/part2-75.html",
    "https://www.cl.cam.ac.uk/teaching/1819/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1920/part1a-75.html",
    "https://www.cl.cam.ac.uk/teaching/1920/part1b-75.html",
    "https://www.cl.cam.ac.uk/teaching/1920/part2-75.html",
    "https://www.cl.cam.ac.uk/teaching/1920/part3.html",
    "https://www.cl.cam.ac.uk/teaching/2021/part1a.html",
    "https://www.cl.cam.ac.uk/teaching/2021/part1b-75.html",
    "https://www.cl.cam.ac.uk/teaching/2021/part2-75.html",
    "https://www.cl.cam.ac.uk/teaching/2021/part3.html",
    "https://www.cl.cam.ac.uk/teaching/2122/part1a.html",
    "https://www.cl.cam.ac.uk/teaching/2122/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/2122/part2-75.html",
    "https://www.cl.cam.ac.uk/teaching/2122/part3.html",
    "https://www.cl.cam.ac.uk/teaching/2223/part1a.html",
    "https://www.cl.cam.ac.uk/teaching/2223/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/2223/part2.html",
    "https://www.cl.cam.ac.uk/teaching/2223/part3.html",
    "https://www.cl.cam.ac.uk/teaching/2324/part1a.html",
    "https://www.cl.cam.ac.uk/teaching/2324/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/2324/part2.html",
    "https://www.cl.cam.ac.uk/teaching/2324/part3.html",
    "https://www.cl.cam.ac.uk/teaching/2425/part1a.html",
    "https://www.cl.cam.ac.uk/teaching/2425/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/2425/part2.html",
    "https://www.cl.cam.ac.uk/teaching/2425/part3.html",
][::-1]


def get_questions(part_url, course_questions):
    year = part_url.split("/")[-2]
    tripos_part = part_url.split("/")[-1].split(".")[0].split("-")[0][4:]

    courses = json.load(open(f"./data/courses_{year}_{tripos_part}.json"))

    for course_code, course_data in courses.items():
        if course_code in course_questions:
            continue

        if course_data["past_exam_questions"]:
            try:
                response = requests.get(course_data["past_exam_questions"])
                soup = BeautifulSoup(response.content, "html.parser")

                # class="campl-content-container"
                main_content_div = soup.find("div", {"class": "campl-main-content"})
                print(year, tripos_part, course_code)

                content_div = main_content_div.find("div", {"class": "campl-content-container"})
                ul = content_div.find("ul")
                for li in ul.find_all("li"):
                    # either there's 2 links - one question and one solution
                    # or there's 1 link - just the question
                    a_tags = li.find_all("a")
                    question_url = a_tags[0]["href"]

                    if len(a_tags) == 2:
                        solution_url = a_tags[1]["href"]
                    else:
                        solution_url = None
                    
                    # the first a tag's text is of the form:
                    # 2004 Paper 8 Question 7
                    question_parts = a_tags[0].text.split(" ")
                    question_year = question_parts[0]
                    question_paper = question_parts[2][0]
                    question_number = question_parts[4]

                    course_questions[course_code][question_year][question_number] = {
                        "question_url": question_url,
                        "solution_url": solution_url,
                        "paper": question_paper,
                    }
            except Exception as e:
                print(e)

    return course_questions

def main():
    course_questions = defaultdict(lambda: defaultdict(dict))

    for url in SOURCE_URLS:
        course_questions = get_questions(url, course_questions)
    
    json.dump(course_questions, open("./data/questions.json", "w"))


if __name__ == "__main__":
    main()