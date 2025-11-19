"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/Header";
import { wordBookAPI } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

export default function WordBookPage() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const { user, isLoading: authLoading } = useRequireAuth();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState({
    word: "",
    meaning: "",
    example: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["wordbook"],
    queryFn: async () => {
      const response = await wordBookAPI.getWords();
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

  const addWordMutation = useMutation({
    mutationFn: async (wordData: any) => {
      await wordBookAPI.createWord(wordData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordbook"] });
      setShowAddForm(false);
      setNewWord({ word: "", meaning: "", example: "" });
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
          <div className="flex justify-between items-center mb-8">
            <div></div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${
                showAddForm
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-gradient-to-r from-theme-primary to-theme-accent text-white hover:from-theme-primary hover:to-theme-accent"
              }`}
            >
              {showAddForm ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t("wordbook.cancel")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t("wordbook.addWord")}
                </span>
              )}
            </button>
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
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 transition-all"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t("wordbook.meaningPlaceholder")}
                    value={newWord.meaning}
                    onChange={(e) =>
                      setNewWord({ ...newWord, meaning: e.target.value })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 transition-all"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t("wordbook.examplePlaceholder")}
                    value={newWord.example}
                    onChange={(e) =>
                      setNewWord({ ...newWord, example: e.target.value })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-6 px-8 py-3 bg-gradient-to-r from-theme-primary to-theme-accent text-white rounded-xl font-semibold hover:from-theme-primary hover:to-theme-accent transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {t("wordbook.addButton")}
                </button>
              </form>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.data.map((word: any) => (
                  <div key={word.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all card-hover">
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
                  </div>
                ))}
              </div>
            )}
            {data?.data.length === 0 && (
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
        </div>
      </div>
    </>
  );
}