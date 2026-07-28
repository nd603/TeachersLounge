// Future: all Supabase post CRUD calls go here
// e.g. fetchPosts(), createPost(), deletePost()

export type Post = {
  id: string;
  text: string;
  topic: string;
  author: string;
  authorId: string;
  anonymous: boolean;
  date: string;
};
