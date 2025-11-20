"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { wordBookAPI, recommendationAPI, examAPI } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/common/Button";

export default function WordBookPage() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const { user, isLoading: authLoading } = useRequireAuth();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWord, setEditingWord] = useState<any | null>(null);
  const [deletingWordId, setDeletingWordId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  
  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [tagsFilter, setTagsFilter] = useState<string>("");
  const [masteryFilter, setMasteryFilter] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const [newWord, setNewWord] = useState({
    word: "",
    meaning: "",
    example: "",
    difficulty: "",
    tags: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["wordbook", currentPage, difficultyFilter, tagsFilter, masteryFilter],
    queryFn: async () => {
      const params: any = {
        page: currentPage,
        limit: pageSize,
      };
      if (difficultyFilter) params.difficulty = difficultyFilter;
      if (tagsFilter) params.tags = tagsFilter.split(",").map((t) => t.trim()).filter(Boolean);
      if (masteryFilter !== undefined) params.masteryLevel = masteryFilter;
      const response = await wordBookAPI.getWords(params);
      return response.data;
    },
    enabled: !!user,
  });

  const { data: reviewList } = useQuery({
    queryKey: ["wordbook-review"],
    queryFn: async () => {
      const response = await wordBookAPI.getReviewList(20);
      return response.data;
    },
    enabled: !!user,
  });

  // 단어 상세 조회
  const { data: selectedWord, isLoading: isLoadingWordDetail } = useQuery({
    queryKey: ["wordbook-detail", selectedWordId],
    queryFn: async () => {
      if (!selectedWordId) return null;
      const response = await wordBookAPI.getWord(selectedWordId);
      return response.data;
    },
    enabled: !!selectedWordId && !!user,
  });

  // 단어장 기반 추천 시험
  const { data: recommendedExams } = useQuery({
    queryKey: ["wordbook-recommended-exams"],
    queryFn: async () => {
      const response = await recommendationAPI.getExamsByWordbook();
      return response.data;
    },
    enabled: !!user,
  });

  const addWordMutation = useMutation({
    mutationFn: async (wordData: any) => {
      const data: any = {
        word: wordData.word,
        meaning: wordData.meaning,
        example: wordData.example || undefined,
      };
      if (wordData.difficulty) data.difficulty = wordData.difficulty;
      if (wordData.tags) {
        data.tags = wordData.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      }
      await wordBookAPI.createWord(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordbook"] });
      setShowAddForm(false);
      setNewWord({ word: "", meaning: "", example: "", difficulty: "", tags: "" });
    },
  });

  const updateWordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await wordBookAPI.updateWord(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordbook"] });
      setEditingWord(null);
    },
  });

  const deleteWordMutation = useMutation({
    mutationFn: async (id: string) => {
      await wordBookAPI.deleteWord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordbook"] });
      setDeletingWordId(null);
    },
  });

  const quizMutation = useMutation({
    mutationFn: async (quizParams: { count: number; tags?: string[]; difficulty?: string }) => {
      const response = await wordBookAPI.generateQuiz(quizParams);
      return response.data;
    },
    onSuccess: (data) => {
      setQuizData(data);
      setCurrentQuizIndex(0);
      setQuizAnswers([]);
      setShowQuizResult(false);
      setShowQuiz(true);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      isCorrect,
    }: {
      id: string;
      isCorrect: boolean;
    }) => {
      await wordBookAPI.recordReview(id, { isCorrect });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordbook-review"] });
      queryClient.invalidateQueries({ queryKey: ["wordbook"] });
    },
  });

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    addWordMutation.mutate(newWord);
  };

  const handleEditWord = (word: any) => {
    setEditingWord({
      ...word,
      tags: word.tags ? word.tags.join(", ") : "",
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWord) return;
    const data: any = {
      word: editingWord.word,
      meaning: editingWord.meaning,
      example: editingWord.example || undefined,
    };
    if (editingWord.difficulty) data.difficulty = editingWord.difficulty;
    if (editingWord.tags) {
      data.tags = editingWord.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    }
    updateWordMutation.mutate({ id: editingWord.id, data });
  };

  const handleDeleteWord = (id: string) => {
    if (window.confirm(t("wordbook.confirmDelete"))) {
      deleteWordMutation.mutate(id);
    }
  };

  const handleStartQuiz = () => {
    const tags = tagsFilter ? tagsFilter.split(",").map((t) => t.trim()).filter(Boolean) : undefined;
    quizMutation.mutate({
      count: 10,
      tags,
      difficulty: difficultyFilter || undefined,
    });
  };

  const handleQuizAnswer = (selectedIndex: number) => {
    const newAnswers = [...quizAnswers, selectedIndex];
    setQuizAnswers(newAnswers);
    
    if (currentQuizIndex < (quizData?.questions?.length || 0) - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
    } else {
      // 퀴즈 완료
      setShowQuizResult(true);
    }
  };

  const handleQuizRestart = () => {
    setShowQuiz(false);
    setQuizData(null);
    setCurrentQuizIndex(0);
    setQuizAnswers([]);
    setShowQuizResult(false);
  };

  // 검색 필터링된 단어 목록
  const filteredWords = useMemo(() => {
    if (!data?.data) return [];
    if (!searchQuery) return data.data;
    
    const query = searchQuery.toLowerCase();
    return data.data.filter((word: any) => 
      word.word.toLowerCase().includes(query) || 
      word.meaning.toLowerCase().includes(query)
    );
  }, [data?.data, searchQuery]);

  const totalPages = data?.meta?.totalPages || 1;

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message={t("wordbook.authChecking")} />
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-theme-gradient-light">
        {/* 헤더 섹션 */}
        <div className="relative bg-gradient-to-r from-theme-primary via-theme-accent to-theme-secondary overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 animate-fade-in">
                {t("wordbook.title")}
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                {t("wordbook.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex-1 w-full md:w-auto">
              {/* 검색 및 필터 섹션 */}
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder={t("wordbook.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-theme-primary transition-all flex-1"
                />
                <select
                  value={difficultyFilter}
                  onChange={(e) => {
                    setDifficultyFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-theme-primary transition-all"
                >
                  <option value="">{t("wordbook.allDifficulties")}</option>
                  <option value="easy">{t("wordbook.difficulty.easy")}</option>
                  <option value="medium">{t("wordbook.difficulty.medium")}</option>
                  <option value="hard">{t("wordbook.difficulty.hard")}</option>
                </select>
                <input
                  type="text"
                  placeholder={t("wordbook.tagsPlaceholder")}
                  value={tagsFilter}
                  onChange={(e) => {
                    setTagsFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-theme-primary transition-all"
                />
                <input
                  type="number"
                  placeholder={t("wordbook.filterByMastery")}
                  value={masteryFilter || ""}
                  onChange={(e) => {
                    setMasteryFilter(e.target.value ? Number(e.target.value) : undefined);
                    setCurrentPage(1);
                  }}
                  min="0"
                  max="100"
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-theme-primary transition-all w-32"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleStartQuiz}
                variant="secondary"
                size="md"
              >
                {t("wordbook.quiz.start")}
              </Button>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                variant={showAddForm ? "secondary" : "primary"}
                size="md"
              >
                {showAddForm ? t("wordbook.cancel") : t("wordbook.addWord")}
              </Button>
            </div>
          </div>

          {showAddForm && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100 animate-slide-up">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-theme-primary to-theme-accent rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                {t("wordbook.addNewWord")}
              </h2>
              <form onSubmit={handleAddWord}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder={t("wordbook.wordPlaceholder")}
                    value={newWord.word}
                    onChange={(e) =>
                      setNewWord({ ...newWord, word: e.target.value })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-theme-primary transition-all"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t("wordbook.meaningPlaceholder")}
                    value={newWord.meaning}
                    onChange={(e) =>
                      setNewWord({ ...newWord, meaning: e.target.value })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-theme-primary transition-all"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t("wordbook.examplePlaceholder")}
                    value={newWord.example}
                    onChange={(e) =>
                      setNewWord({ ...newWord, example: e.target.value })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-theme-primary transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <select
                    value={newWord.difficulty}
                    onChange={(e) =>
                      setNewWord({ ...newWord, difficulty: e.target.value })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-theme-primary transition-all"
                  >
                    <option value="">{t("wordbook.difficultyPlaceholder")}</option>
                    <option value="easy">{t("wordbook.difficulty.easy")}</option>
                    <option value="medium">{t("wordbook.difficulty.medium")}</option>
                    <option value="hard">{t("wordbook.difficulty.hard")}</option>
                  </select>
                  <input
                    type="text"
                    placeholder={t("wordbook.tagsPlaceholder")}
                    value={newWord.tags}
                    onChange={(e) =>
                      setNewWord({ ...newWord, tags: e.target.value })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-theme-primary transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="mt-6"
                  isLoading={addWordMutation.isPending}
                >
                  {t("wordbook.addButton")}
                </Button>
              </form>
            </div>
          )}

          {/* 단어장 기반 추천 시험 */}
          {recommendedExams && recommendedExams.data && recommendedExams.data.length > 0 && (
            <div className="bg-gradient-to-br from-theme-primary/10 to-theme-accent/10 rounded-2xl shadow-lg p-8 mb-8 border-2 border-theme-primary/20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-theme-primary to-theme-accent rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                {t("wordbook.recommendedExams")}
              </h2>
              <p className="text-gray-600 mb-6">
                {t("wordbook.recommendedExamsDescription")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedExams.data.map((exam: any) => (
                  <Link
                    key={exam.id}
                    href={`/exams/${exam.id}`}
                    className="bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-all hover:border-theme-primary"
                  >
                    <div className="font-bold text-lg text-gray-900 mb-2">{exam.title}</div>
                    {exam.description && (
                      <div className="text-sm text-gray-600 mb-3 line-clamp-2">{exam.description}</div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-theme-primary">
                      <span>{t("wordbook.viewExam")}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {reviewList && reviewList.data && reviewList.data.length > 0 && (
            <div className="bg-gradient-to-br from-warning/10 to-warning/20 rounded-2xl shadow-lg p-8 mb-8 border-2 border-warning/20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-warning to-warning rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {t("wordbook.reviewWords")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviewList.data.map((word: any) => (
                  <div key={word.id} className="bg-white rounded-xl p-6 border border-warning/20 shadow-md hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="font-bold text-xl text-gray-900 mb-1">{word.word}</div>
                        <div className="text-gray-600">{word.meaning}</div>
                      </div>
                      <div className="px-3 py-1 bg-gradient-to-r from-warning/20 to-warning/30 rounded-lg border border-warning/20">
                        <div className="text-xs font-semibold text-warning mb-0.5">{t("wordbook.mastery")}</div>
                        <div className="text-sm font-bold text-warning">{word.masteryLevel}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-gradient-to-r from-warning to-warning h-2 rounded-full transition-all"
                        style={{ width: `${word.masteryLevel}%` }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          reviewMutation.mutate({ id: word.id, isCorrect: true })
                        }
                        className="flex-1 bg-gradient-to-r from-success to-success text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-success hover:to-success transition-all shadow-md hover:shadow-lg"
                      >
                        ✓ {t("wordbook.correct")}
                      </button>
                      <button
                        onClick={() =>
                          reviewMutation.mutate({ id: word.id, isCorrect: false })
                        }
                        className="flex-1 bg-gradient-to-r from-error to-error text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-error hover:to-error transition-all shadow-md hover:shadow-lg"
                      >
                        ✗ {t("wordbook.incorrect")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-theme-primary to-theme-accent rounded-full"></div>
              {t("wordbook.allWords")}
            </h2>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-theme-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 font-medium">{t("wordbook.loadingWords")}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWords.map((word: any) => (
                    <div 
                      key={word.id} 
                      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all card-hover cursor-pointer"
                      onClick={() => setSelectedWordId(word.id)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-bold text-xl text-gray-900">{word.word}</div>
                        <div className="px-3 py-1.5 bg-gradient-to-r from-theme-primary/20 to-theme-accent/20 rounded-lg border border-theme-primary/20">
                          <div className="text-xs font-semibold text-theme-primary mb-0.5">{t("wordbook.mastery")}</div>
                          <div className="text-sm font-bold text-theme-primary">{word.masteryLevel}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className="bg-gradient-to-r from-theme-primary to-theme-accent h-2 rounded-full transition-all"
                          style={{ width: `${word.masteryLevel}%` }}
                        />
                      </div>
                      <div className="text-gray-700 mb-3 font-medium">{word.meaning}</div>
                      {word.example && (
                        <div className="text-sm text-gray-500 italic mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          "{word.example}"
                        </div>
                      )}
                      {word.difficulty && (
                        <div className="mb-2">
                          <span className="text-xs px-2 py-1 bg-theme-primary/10 text-theme-primary rounded-full">
                            {t(`wordbook.difficulty.${word.difficulty}`)}
                          </span>
                        </div>
                      )}
                      {word.tags && word.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {word.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="text-xs bg-gradient-to-r from-theme-secondary/20 to-theme-accent/20 text-theme-secondary px-2.5 py-1 rounded-full font-medium border border-theme-secondary/20"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => handleEditWord(word)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          {t("wordbook.editButton")}
                        </Button>
                        <Button
                          onClick={() => handleDeleteWord(word.id)}
                          variant="error"
                          size="sm"
                          className="flex-1"
                          isLoading={deleteWordMutation.isPending && deletingWordId === word.id}
                        >
                          {t("wordbook.deleteButton")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                    >
                      {t("wordbook.pagination.previous")}
                    </Button>
                    <span className="text-gray-700 px-4">
                      {t("wordbook.pagination.page")} {currentPage} {t("wordbook.pagination.of")} {totalPages}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                    >
                      {t("wordbook.pagination.next")}
                    </Button>
                  </div>
                )}
              </>
            )}
            {filteredWords.length === 0 && !isLoading && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-theme-primary/20 to-theme-accent/20 rounded-2xl mb-6 shadow-lg">
                  <svg className="w-12 h-12 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-gray-700 mb-2">
                  {t("wordbook.noWordsTitle")}
                </p>
                <p className="text-gray-500 mb-6">{t("wordbook.noWordsSubtitle")}</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-theme-primary to-theme-accent text-white rounded-lg font-semibold hover:from-theme-primary hover:to-theme-accent transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t("wordbook.addFirstWord")}
                </button>
              </div>
            )}
          </div>

          {/* 수정 모달 */}
          {editingWord && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full animate-scale-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-theme-primary to-theme-accent rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  {t("wordbook.editWord")}
                </h2>
                <form onSubmit={handleSaveEdit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder={t("wordbook.wordPlaceholder")}
                      value={editingWord.word}
                      onChange={(e) =>
                        setEditingWord({ ...editingWord, word: e.target.value })
                      }
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-theme-primary transition-all"
                      required
                    />
                    <input
                      type="text"
                      placeholder={t("wordbook.meaningPlaceholder")}
                      value={editingWord.meaning}
                      onChange={(e) =>
                        setEditingWord({ ...editingWord, meaning: e.target.value })
                      }
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-theme-primary transition-all"
                      required
                    />
                    <input
                      type="text"
                      placeholder={t("wordbook.examplePlaceholder")}
                      value={editingWord.example || ""}
                      onChange={(e) =>
                        setEditingWord({ ...editingWord, example: e.target.value })
                      }
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-theme-primary transition-all"
                    />
                    <select
                      value={editingWord.difficulty || ""}
                      onChange={(e) =>
                        setEditingWord({ ...editingWord, difficulty: e.target.value })
                      }
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-theme-primary transition-all"
                    >
                      <option value="">{t("wordbook.difficultyPlaceholder")}</option>
                      <option value="easy">{t("wordbook.difficulty.easy")}</option>
                      <option value="medium">{t("wordbook.difficulty.medium")}</option>
                      <option value="hard">{t("wordbook.difficulty.hard")}</option>
                    </select>
                    <input
                      type="text"
                      placeholder={t("wordbook.tagsPlaceholder")}
                      value={editingWord.tags || ""}
                      onChange={(e) =>
                        setEditingWord({ ...editingWord, tags: e.target.value })
                      }
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-theme-primary transition-all md:col-span-2"
                    />
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button
                      type="button"
                      onClick={() => setEditingWord(null)}
                      variant="outline"
                      size="md"
                      className="flex-1"
                    >
                      {t("wordbook.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="flex-1"
                      isLoading={updateWordMutation.isPending}
                    >
                      {t("wordbook.saveButton")}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 퀴즈 모달 */}
          {showQuiz && quizData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full animate-scale-in">
                {!showQuizResult ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("wordbook.quiz.title")}</h2>
                    {quizData.questions && quizData.questions[currentQuizIndex] && (
                      <div>
                        <div className="mb-4 text-sm text-gray-600">
                          {t("wordbook.quiz.question")} ({currentQuizIndex + 1} / {quizData.questions.length})
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-6 text-center py-8 bg-theme-primary/10 rounded-xl">
                          {quizData.questions[currentQuizIndex].word}
                        </div>
                        {quizData.questions[currentQuizIndex].example && (
                          <div className="text-sm text-gray-500 italic mb-6 text-center">
                            "{quizData.questions[currentQuizIndex].example}"
                          </div>
                        )}
                        <div className="space-y-3 mb-6">
                          {quizData.questions[currentQuizIndex].options.map((option: string, index: number) => (
                            <button
                              key={index}
                              onClick={() => handleQuizAnswer(index)}
                              className="w-full px-6 py-4 text-left border-2 border-gray-200 rounded-xl hover:border-theme-primary hover:bg-theme-primary/5 transition-all"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("wordbook.quiz.result")}</h2>
                    <div className="text-center py-8">
                      <div className="text-4xl font-bold text-theme-primary mb-4">
                        {quizData.questions.filter((q: any, i: number) => 
                          quizAnswers[i] === q.correctIndex
                        ).length} / {quizData.questions.length}
                      </div>
                      <div className="text-gray-600 mb-6">
                        {t("wordbook.quiz.correctCount")}: {quizData.questions.filter((q: any, i: number) => 
                          quizAnswers[i] === q.correctIndex
                        ).length} | {t("wordbook.quiz.incorrectCount")}: {quizData.questions.filter((q: any, i: number) => 
                          quizAnswers[i] !== q.correctIndex
                        ).length}
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={handleQuizRestart}
                          variant="primary"
                          size="md"
                        >
                          {t("wordbook.quiz.restart")}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowQuiz(false);
                            setQuizData(null);
                            setCurrentQuizIndex(0);
                            setQuizAnswers([]);
                            setShowQuizResult(false);
                          }}
                          variant="outline"
                          size="md"
                        >
                          {t("wordbook.quiz.close")}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 단어 상세 모달 */}
          {selectedWordId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full animate-scale-in max-h-[90vh] overflow-y-auto">
                {isLoadingWordDetail ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 border-4 border-theme-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 font-medium">{t("wordbook.loadingWordDetail")}</p>
                  </div>
                ) : selectedWord ? (
                  <>
                    <div className="flex justify-between items-start mb-6">
                      <h2 className="text-3xl font-bold text-gray-900">{selectedWord.word}</h2>
                      <button
                        onClick={() => setSelectedWordId(null)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label={t("common.close")}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* 의미 */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-2">{t("wordbook.detail.meaning")}</h3>
                        <p className="text-lg text-gray-900 font-medium">{selectedWord.meaning}</p>
                      </div>

                      {/* 예문 */}
                      {selectedWord.example && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 mb-2">{t("wordbook.detail.example")}</h3>
                          <p className="text-gray-700 italic p-4 bg-gray-50 rounded-lg border border-gray-200">
                            "{selectedWord.example}"
                          </p>
                        </div>
                      )}

                      {/* 난이도 */}
                      {selectedWord.difficulty && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 mb-2">{t("wordbook.detail.difficulty")}</h3>
                          <span className="inline-block px-3 py-1.5 bg-theme-primary/10 text-theme-primary rounded-full font-medium">
                            {t(`wordbook.difficulty.${selectedWord.difficulty}`)}
                          </span>
                        </div>
                      )}

                      {/* 태그 */}
                      {selectedWord.tags && selectedWord.tags.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 mb-2">{t("wordbook.detail.tags")}</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedWord.tags.map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="text-sm bg-gradient-to-r from-theme-secondary/20 to-theme-accent/20 text-theme-secondary px-3 py-1.5 rounded-full font-medium border border-theme-secondary/20"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 숙련도 */}
                      {selectedWord.masteryLevel !== undefined && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 mb-2">{t("wordbook.detail.mastery")}</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">{selectedWord.masteryLevel}%</span>
                              {selectedWord.reviewCount !== undefined && (
                                <span className="text-xs text-gray-500">
                                  {t("wordbook.detail.reviewCount")}: {selectedWord.reviewCount}
                                </span>
                              )}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-theme-primary to-theme-accent h-3 rounded-full transition-all"
                                style={{ width: `${selectedWord.masteryLevel}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 마지막 복습일 */}
                      {selectedWord.lastReviewedAt && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 mb-2">{t("wordbook.detail.lastReviewed")}</h3>
                          <p className="text-gray-700">
                            {new Date(selectedWord.lastReviewedAt).toLocaleDateString(locale, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      )}

                      {/* 생성일 */}
                      {selectedWord.createdAt && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 mb-2">{t("wordbook.detail.createdAt")}</h3>
                          <p className="text-gray-700">
                            {new Date(selectedWord.createdAt).toLocaleDateString(locale, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      )}

                      {/* 액션 버튼 */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <Button
                          onClick={() => {
                            handleEditWord(selectedWord);
                            setSelectedWordId(null);
                          }}
                          variant="primary"
                          size="md"
                          className="flex-1"
                        >
                          {t("wordbook.editButton")}
                        </Button>
                        <Button
                          onClick={() => {
                            handleDeleteWord(selectedWord.id);
                            setSelectedWordId(null);
                          }}
                          variant="error"
                          size="md"
                          className="flex-1"
                          isLoading={deleteWordMutation.isPending && deletingWordId === selectedWord.id}
                        >
                          {t("wordbook.deleteButton")}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-gray-500">{t("wordbook.detail.notFound")}</p>
                    <Button
                      onClick={() => setSelectedWordId(null)}
                      variant="outline"
                      size="md"
                      className="mt-4"
                    >
                      {t("common.close")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}