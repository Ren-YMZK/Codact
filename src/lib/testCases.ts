export interface TestCase {
  input: string;
  expected: string;
}

// Lesson IDはSupabaseダッシュボードで確認して置き換えてください
export const testCases: Record<string, TestCase[]> = {
  // 「リストを使ってみよう」
  "5281908b-98cc-45ce-95d2-b3ae6df3464c": [
    { input: "", expected: "田中\n佐藤\n鈴木" },
  ],
};
