import { createTroute } from "@olifog/troute";
import { getAllTriposes } from "./queries/tripos";
import { getTriposParts } from "./queries/triposPart";
import { getTriposPartCourses } from "./queries/course";
import { getCourseYears } from "./queries/courseYear";
import {
  getCourseYearQuestions,
  getQuestionAnswers,
  getQuestionWithContextById,
} from "./queries/question";

export const { GET, troute } = createTroute({
  getAllTriposes,
  getTriposParts,
  getTriposPartCourses,
  getCourseYears,
  getCourseYearQuestions,
  getQuestionWithContextById,
  getQuestionAnswers,
});
