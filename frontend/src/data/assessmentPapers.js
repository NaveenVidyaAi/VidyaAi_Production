const pyq = (file, subject, year, set, medium = "Hindi") => ({
  file,
  fileUrl: `/pyq/${file}`,
  classLevel: "10",
  subject,
  year,
  set,
  medium,
  kind: "pyq",
  version: "1.0.0",
  title: `Class 10 ${subject} PYQ ${year} Set ${set}`,
});

const model = (subject, slug, medium = "Hindi") => {
  const file = `cgbse-class-10-${slug}-model-paper-2025-26-v1.0.0.pdf`;
  return {
    file,
    fileUrl: `/pyq/${file}`,
    classLevel: "10",
    subject,
    year: "2025-26",
    set: "Model",
    medium,
    kind: "model",
    version: "1.0.0",
    title: `Class 10 ${subject} Model Paper 2025-26`,
  };
};

export const assessmentPapers = [
  model("English", "english", "English"),
  model("Hindi", "hindi"),
  model("Math", "math"),
  model("Sanskrit", "sanskrit"),
  model("Science", "science"),
  model("Social Science", "social-science"),
  pyq("class_10_english_PYQ26_SET_A.pdf", "English", "2026", "A", "English"),
  pyq("class_10_english_PYQ25_SET_A.pdf", "English", "2025", "A", "English"),
  pyq("class_10_hindi_PYQ25_SET_B.pdf", "Hindi", "2025", "B"),
  pyq("class_10_hindi_PYQ25_SET_C.pdf", "Hindi", "2025", "C"),
  pyq("class_10_math_PYQ25_SET_A.pdf", "Math", "2025", "A"),
  pyq("class_10_sanskrit_PYQ25_SET_A.pdf", "Sanskrit", "2025", "A"),
  pyq("class_10_science_PYQ25_SET_A.pdf", "Science", "2025", "A"),
  pyq("class_10_social_science_PYQ25_SET_A.pdf", "Social Science", "2025", "A"),
  pyq("class_10_hindi_PYQ24_SET_A.pdf", "Hindi", "2024", "A"),
  pyq("class_10_hindi_PYQ24_SET_A_2.pdf", "Hindi", "2024", "A 2"),
  pyq("class_10_hindi_PYQ24_SET_B.pdf", "Hindi", "2024", "B"),
  pyq("class_10_hindi_PYQ24_SET_C.pdf", "Hindi", "2024", "C"),
  pyq("class_10_math_PYQ24_SET_A.pdf", "Math", "2024", "A"),
  pyq("class_10_science_PYQ24_SET_A.pdf", "Science", "2024", "A"),
  pyq("class_10_social_science_PYQ24_SET_C.pdf", "Social Science", "2024", "C"),
  pyq("class_10_hindi_PYQ23_SET_A.pdf", "Hindi", "2023", "A"),
  pyq("class_10_hindi_PYQ23_SET_A_2.pdf", "Hindi", "2023", "A 2"),
  pyq("class_10_hindi_PYQ23_SET_B.pdf", "Hindi", "2023", "B"),
  pyq("class_10_math_PYQ23_SET_A.pdf", "Math", "2023", "A"),
  pyq("class_10_science_PYQ23_SET_A.pdf", "Science", "2023", "A"),
  pyq("class_10_social_science_PYQ23_SET_A.pdf", "Social Science", "2023", "A"),
];
