"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/Header";
import { wordBookAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function WordBookPage() {
  const user = useAuthStore((state) => state.user);
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

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">로그인이 필요합니다.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">단어장</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {showAddForm ? "취소" : "단어 추가"}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <form onSubmit={handleAddWord}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="단어"
                  value={newWord.word}
                  onChange={(e) =>
                    setNewWord({ ...newWord, word: e.target.value })
                  }
                  className="px-4 py-2 border rounded-md"
                  required
                />
                <input
                  type="text"
                  placeholder="의미"
                  value={newWord.meaning}
                  onChange={(e) =>
                    setNewWord({ ...newWord, meaning: e.target.value })
                  }
                  className="px-4 py-2 border rounded-md"
                  required
                />
                <input
                  type="text"
                  placeholder="예문 (선택)"
                  value={newWord.example}
                  onChange={(e) =>
                    setNewWord({ ...newWord, example: e.target.value })
                  }
                  className="px-4 py-2 border rounded-md"
                />
              </div>
              <button
                type="submit"
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                추가
              </button>
            </form>
          </div>
        )}

        {reviewList && reviewList.data && reviewList.data.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">복습할 단어</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewList.data.map((word: any) => (
                <div key={word.id} className="bg-white rounded-lg p-4 border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-lg">{word.word}</div>
                      <div className="text-gray-600">{word.meaning}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      숙련도: {word.masteryLevel}%
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() =>
                        reviewMutation.mutate({ id: word.id, isCorrect: true })
                      }
                      className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      정답
                    </button>
                    <button
                      onClick={() =>
                        reviewMutation.mutate({ id: word.id, isCorrect: false })
                      }
                      className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      오답
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4">전체 단어 목록</h2>
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.data.map((word: any) => (
                <div key={word.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-lg">{word.word}</div>
                    <div className="text-sm text-gray-500">
                      {word.masteryLevel}%
                    </div>
                  </div>
                  <div className="text-gray-600 mb-2">{word.meaning}</div>
                  {word.example && (
                    <div className="text-sm text-gray-500 italic mb-2">
                      {word.example}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {word.tags?.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {data?.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              등록된 단어가 없습니다.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
