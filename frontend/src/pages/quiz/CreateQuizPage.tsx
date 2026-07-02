import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizzesAPI, aiAPI } from "@/lib/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Sparkles, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

interface Choice {
  choice_text: string;
  is_correct: boolean;
  order: number;
}

interface QuestionForm {
  question_text: string;
  question_type: string;
  explanation: string;
  order: number;
  points: number;
  time_limit: number;
  choices: Choice[];
}

export default function CreateQuizPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [isPublic, setIsPublic] = useState(true);
  const [timePerQuestion, setTimePerQuestion] = useState(10);
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { question_text: "", question_type: "multiple_choice", explanation: "", order: 0, points: 1000, time_limit: 10, choices: [
      { choice_text: "", is_correct: false, order: 0 },
      { choice_text: "", is_correct: false, order: 1 },
      { choice_text: "", is_correct: false, order: 2 },
      { choice_text: "", is_correct: false, order: 3 },
    ]},
  ]);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    quizzesAPI.getCategories().then((res) => setCategories(res.data)).catch(() => {});
    if (id) {
      quizzesAPI.get(id).then((res) => {
        const q = res.data;
        setTitle(q.title);
        setDescription(q.description || "");
        setDifficulty(q.difficulty);
        setIsPublic(q.is_public);
        setTimePerQuestion(q.time_per_question);
        setCategoryId(q.category_id || "");
        setQuestions(q.questions.map((que: any) => ({
          question_text: que.question_text,
          question_type: que.question_type,
          explanation: que.explanation || "",
          order: que.order,
          points: que.points,
          time_limit: que.time_limit,
          choices: que.choices.map((c: any) => ({
            choice_text: c.choice_text,
            is_correct: c.is_correct,
            order: c.order,
          })),
        })));
      }).catch(() => toast.error("Quiz not found"));
    }
  }, [id]);

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: "", question_type: "multiple_choice", explanation: "", order: questions.length, points: 1000, time_limit: 20,
      choices: [
        { choice_text: "", is_correct: false, order: 0 },
        { choice_text: "", is_correct: false, order: 1 },
        { choice_text: "", is_correct: false, order: 2 },
        { choice_text: "", is_correct: false, order: 3 },
      ],
    }]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[idx] as any)[field] = value;
    setQuestions(updated);
  };

  const updateChoice = (qIdx: number, cIdx: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[qIdx].choices[cIdx] as any)[field] = value;
    setQuestions(updated);
  };

  const addChoice = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx].choices.push({ choice_text: "", is_correct: false, order: updated[qIdx].choices.length });
    setQuestions(updated);
  };

  const removeChoice = (qIdx: number, cIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx].choices.length <= 2) return;
    updated[qIdx].choices = updated[qIdx].choices.filter((_, i) => i !== cIdx);
    setQuestions(updated);
  };

  const setCorrectChoice = (qIdx: number, cIdx: number) => {
    const updated = [...questions];
    updated[qIdx].choices = updated[qIdx].choices.map((c, i) => ({ ...c, is_correct: i === cIdx }));
    setQuestions(updated);
  };

  const handleAIGenerate = async () => {
    const topic = title || prompt("Enter a topic for AI generation:") || "";
    if (!topic) return;
    setAiGenerating(true);
    try {
      const res = await aiAPI.generateQuiz({ topic, difficulty, num_questions: 20 });
      const data = res.data;
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.questions) {
        const generated: QuestionForm[] = [];
        for (const q of data.questions) {
          const question: QuestionForm = {
            question_text: q.question_text,
            question_type: q.question_type || "multiple_choice",
            explanation: q.explanation || "",
            order: generated.length,
            points: 1000,
            time_limit: timePerQuestion,
            choices: [],
          };
          if (q.choices) {
            for (const c of q.choices) {
              question.choices.push({
                choice_text: c.choice_text,
                is_correct: c.is_correct,
                order: question.choices.length,
              });
            }
          }
          generated.push(question);
        }
        setQuestions(generated);
        toast.success(`${generated.length} questions generated by AI!`);
      } else {
        toast.success(data.raw ? `Raw AI response: ${data.raw.slice(0, 100)}...` : "AI response received (no questions)");
      }
    } catch {
      toast.error("AI generation failed. Check your API key.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        difficulty,
        is_public: isPublic,
        category_id: categoryId || null,
        time_per_question: timePerQuestion,
        points_per_question: 1000,
        randomize_questions: false,
        randomize_answers: true,
        questions: questions.map((q, i) => ({
          ...q,
          order: i,
          choices: q.choices.filter((c) => c.choice_text.trim()),
        })),
      };
      let quizId = id;
      if (id) {
        await quizzesAPI.update(id, payload);
        toast.success("Quiz updated!");
      } else {
        const res = await quizzesAPI.create(payload);
        quizId = res.data.id;
        toast.success("Quiz created!");
      }
      navigate(`/host/${quizId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold">{id ? "Edit Quiz" : "Create Quiz"}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAIGenerate} loading={aiGenerating}>
            <Sparkles className="w-4 h-4 mr-2" /> AI Generate 20
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {id ? "Update" : "Done"}
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6 space-y-4">
          <Input label="Quiz Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter quiz title" />
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your quiz" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary-500 outline-none resize-none" rows={3} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary-500 outline-none">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time/Question (s)</label>
              <input type="number" value={timePerQuestion} onChange={(e) => setTimePerQuestion(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary-500 outline-none">
                <option value="">None</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                <span className="text-sm font-medium">Public</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {questions.map((q, qIdx) => (
        <Card key={qIdx} className="mb-4">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-400" />
                Question {qIdx + 1}
              </h3>
              <div className="flex gap-2">
                <select value={q.question_type} onChange={(e) => updateQuestion(qIdx, "question_type", e.target.value)} className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none">
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="fill_in_blank">Fill in Blank</option>
                  <option value="short_answer">Short Answer</option>
                </select>
                <input type="number" value={q.points} onChange={(e) => updateQuestion(qIdx, "points", Number(e.target.value))} className="w-20 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none" placeholder="Points" />
                <button onClick={() => removeQuestion(qIdx)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <input
              value={q.question_text}
              onChange={(e) => updateQuestion(qIdx, "question_text", e.target.value)}
              placeholder="Enter your question..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary-500 outline-none mb-4"
            />

            <div className="space-y-2">
              {q.choices.map((c, cIdx) => (
                <div key={cIdx} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`correct-${qIdx}`}
                    checked={c.is_correct}
                    onChange={() => setCorrectChoice(qIdx, cIdx)}
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                  />
                  <input
                    value={c.choice_text}
                    onChange={(e) => updateChoice(qIdx, cIdx, "choice_text", e.target.value)}
                    placeholder={`Option ${cIdx + 1}`}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary-500 outline-none"
                  />
                  {q.choices.length > 2 && (
                    <button onClick={() => removeChoice(qIdx, cIdx)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addChoice(qIdx)} className="text-sm text-primary-500 hover:underline mt-2">
                + Add option
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Explanation (optional)</label>
              <textarea
                value={q.explanation}
                onChange={(e) => updateQuestion(qIdx, "explanation", e.target.value)}
                placeholder="Explain why the correct answer is right..."
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary-500 outline-none resize-none text-sm"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-col sm:flex-row gap-4 mt-6 sticky bottom-0 bg-white dark:bg-gray-900 p-4 -mx-4 border-t border-gray-200 dark:border-gray-800">
        <Button variant="outline" onClick={addQuestion} className="sm:flex-1">
          <Plus className="w-4 h-4 mr-2" /> Add Question
        </Button>
        <Button onClick={handleSave} loading={saving} className="sm:flex-1 text-lg py-4">
          {id ? "Update Quiz" : "Done — Host Game"}
        </Button>
      </div>
    </div>
  );
}
