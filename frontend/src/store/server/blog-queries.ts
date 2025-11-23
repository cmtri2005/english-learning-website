/**
 * Blog Queries (Server State)
 * 
 * React Query hooks for blog-related API calls.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { blogApi, type BlogPost, type CreateBlogPostRequest, type UpdateBlogPostRequest, type CreateCommentRequest, type BlogListParams } from '@/services/blog/blog-api';
import { queryKeys } from '../config/query-client';

/**
 * Query: Get blog posts list
 */
export function useBlogPosts(params?: BlogListParams) {
  return useQuery({
    queryKey: ['blog', 'posts', params],
    queryFn: async () => {
      const response = await blogApi.getPosts(params);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to get blog posts');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Query: Get single blog post
 */
export function useBlogPost(
  identifier: string | number,
  options?: { enabled?: boolean }
) {
  return useQuery<BlogPost>({
    queryKey: ['blog', 'post', identifier],
    queryFn: async () => {
      const response = await blogApi.getPost(identifier);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to get blog post');
      }
      return response.data;
    },
    enabled: options?.enabled !== false && !!identifier,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Query: Get blog categories
 */
export function useBlogCategories() {
  return useQuery({
    queryKey: ['blog', 'categories'],
    queryFn: async () => {
      const response = await blogApi.getCategories();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to get categories');
      }
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Mutation: Create blog post
 */
export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBlogPostRequest) => {
      const response = await blogApi.createPost(data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create blog post');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate blog posts list
      queryClient.invalidateQueries({ queryKey: ['blog', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog', 'categories'] });
    },
  });
}

/**
 * Mutation: Update blog post
 */
export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateBlogPostRequest }) => {
      const response = await blogApi.updatePost(id, data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update blog post');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Update specific post cache
      queryClient.setQueryData(['blog', 'post', data.id], data);
      queryClient.setQueryData(['blog', 'post', data.slug], data);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['blog', 'posts'] });
    },
  });
}

/**
 * Mutation: Delete blog post
 */
export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await blogApi.deletePost(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete blog post');
      }
      return id;
    },
    onSuccess: (id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['blog', 'post', id] });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['blog', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog', 'categories'] });
    },
  });
}

/**
 * Mutation: Toggle like on blog post
 */
export function useToggleBlogLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      const response = await blogApi.toggleLike(postId);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to toggle like');
      }
      return { postId, ...response.data };
    },
    onSuccess: ({ postId, liked, likes_count }) => {
      // Update post cache
      queryClient.setQueryData<BlogPost>(['blog', 'post', postId], (old) => {
        if (!old) return old;
        return { ...old, is_liked: liked, likes_count };
      });

      // Update in list cache
      queryClient.setQueriesData<{ posts: BlogPost[] }>({ queryKey: ['blog', 'posts'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.map((post) =>
            post.id === postId ? { ...post, is_liked: liked, likes_count } : post
          ),
        };
      });
    },
  });
}

/**
 * Mutation: Add comment to blog post
 */
export function useAddBlogComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, data }: { postId: number; data: CreateCommentRequest }) => {
      const response = await blogApi.addComment(postId, data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to add comment');
      }
      return { postId, comment: response.data };
    },
    onSuccess: ({ postId, comment }) => {
      // Update post cache with new comment
      queryClient.setQueryData<BlogPost>(['blog', 'post', postId], (old) => {
        if (!old) return old;
        return {
          ...old,
          comments: [...(old.comments || []), comment],
          comments_count: (old.comments_count || 0) + 1,
        };
      });
    },
  });
}

