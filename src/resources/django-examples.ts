export const DJANGO_EXAMPLES = {
  "django-to-nextjs-patterns": {
    title: "🌐 Django to Next.js/TypeScript Patterns",
    content: `# Django to Next.js/TypeScript Patterns

## Overview

Converting Django web applications to Next.js with TypeScript, covering models, views, serializers, and authentication patterns based on real-world Django → TypeScript migration projects.

## Django Models → TypeScript Types

### Python Django Models

\`\`\`python
# Django models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from typing import Optional
import uuid

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bio = models.TextField(blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name_plural = "categories"

class Post(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'
        ARCHIVED = 'archived', 'Archived'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField('Tag', blank=True)
    view_count = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        null=True, 
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default='#000000')  # Hex color

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
\`\`\`

### TypeScript Type Definitions

\`\`\`typescript
// types/models.ts - Direct TypeScript equivalents

// User model equivalent
export interface User {
  id: string; // UUID as string
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio?: string | null;
  avatar?: string | null;
  is_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string; // ISO datetime string
  last_login?: string | null;
  created_at: string;
  updated_at: string;
}

// Enum equivalent for Django TextChoices
export type PostStatus = 'draft' | 'published' | 'archived';

export const PostStatusChoices = {
  DRAFT: 'draft' as const,
  PUBLISHED: 'published' as const,
  ARCHIVED: 'archived' as const,
} as const;

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string; // Hex color code
}

export interface Post {
  id: string; // UUID as string
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  author: User; // Full user object or just ID in some contexts
  category?: Category | null;
  tags: Tag[];
  view_count: number;
  rating?: number | null; // Decimal as number
  created_at: string;
  updated_at: string;
  
  // Computed/related fields
  comments?: Comment[];
  comments_count?: number;
}

// Self-referencing type for threaded comments
export interface Comment {
  id: number;
  post: string; // Post ID (UUID)
  author: User;
  content: string;
  parent?: Comment | null;
  is_approved: boolean;
  created_at: string;
  
  // Nested replies for tree structure
  replies?: Comment[];
}

// API Response wrappers
export interface PaginatedResponse<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
\`\`\`

## Django Views → Next.js API Routes

### Django REST Framework Views

\`\`\`python
# Django views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Avg
from django.utils.text import slugify
from .models import Post, Category, User
from .serializers import PostSerializer, PostCreateSerializer

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Post.objects.select_related('author', 'category').prefetch_related('tags', 'comments')
        
        # Filtering
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
            
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(content__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PostCreateSerializer
        return PostSerializer
    
    def perform_create(self, serializer):
        serializer.save(
            author=self.request.user,
            slug=slugify(serializer.validated_data['title'])
        )
    
    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        post = self.get_object()
        post.view_count += 1
        post.save()
        return Response({'view_count': post.view_count})
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        popular_posts = self.get_queryset().annotate(
            avg_rating=Avg('rating')
        ).filter(
            view_count__gt=100
        ).order_by('-view_count', '-avg_rating')[:10]
        
        serializer = self.get_serializer(popular_posts, many=True)
        return Response(serializer.data)
\`\`\`

### Next.js API Routes

\`\`\`typescript
// pages/api/posts/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { z } from 'zod';

// Request validation schemas
const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category_id: z.number().optional(),
  tags: z.array(z.number()).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

const PostQuerySchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      return handleGetPosts(req, res);
    case 'POST':
      return handleCreatePost(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetPosts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const query = PostQuerySchema.parse(req.query);
    
    // Build database query (using Prisma/similar ORM)
    const whereClause: any = {};
    
    if (query.status) {
      whereClause.status = query.status;
    }
    
    if (query.category) {
      whereClause.category = { slug: query.category };
    }
    
    if (query.search) {
      whereClause.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    
    const skip = (query.page - 1) * query.limit;
    
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        include: {
          author: true,
          category: true,
          tags: true,
          _count: { select: { comments: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.post.count({ where: whereClause }),
    ]);
    
    // Transform to API format
    const transformedPosts = posts.map(transformPostForAPI);
    
    const response: PaginatedResponse<Post> = {
      count: totalCount,
      next: skip + query.limit < totalCount 
        ? \`/api/posts?page=\${query.page + 1}\`
        : null,
      previous: query.page > 1 
        ? \`/api/posts?page=\${query.page - 1}\`
        : null,
      results: transformedPosts,
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreatePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const postData = CreatePostSchema.parse(req.body);
    
    // Generate slug from title
    const slug = slugify(postData.title);
    
    const post = await prisma.post.create({
      data: {
        ...postData,
        slug,
        author_id: session.user.id,
        tags: postData.tags 
          ? { connect: postData.tags.map(id => ({ id })) }
          : undefined,
      },
      include: {
        author: true,
        category: true,
        tags: true,
      },
    });
    
    const transformedPost = transformPostForAPI(post);
    
    res.status(201).json({
      success: true,
      data: transformedPost,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }
    
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// pages/api/posts/[id]/increment-views.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { id } = req.query;
  
  try {
    const post = await prisma.post.update({
      where: { id: id as string },
      data: {
        view_count: { increment: 1 },
      },
      select: { view_count: true },
    });
    
    res.status(200).json({ view_count: post.view_count });
  } catch (error) {
    console.error('Error incrementing views:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// pages/api/posts/popular.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const popularPosts = await prisma.post.findMany({
      where: {
        view_count: { gt: 100 },
      },
      include: {
        author: true,
        category: true,
        tags: true,
        _count: { select: { comments: true } },
      },
      orderBy: [
        { view_count: 'desc' },
        { rating: 'desc' },
      ],
      take: 10,
    });
    
    const transformedPosts = popularPosts.map(transformPostForAPI);
    
    res.status(200).json(transformedPosts);
  } catch (error) {
    console.error('Error fetching popular posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Utility functions
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function transformPostForAPI(post: any): Post {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    status: post.status,
    author: post.author,
    category: post.category,
    tags: post.tags,
    view_count: post.view_count,
    rating: post.rating,
    created_at: post.created_at.toISOString(),
    updated_at: post.updated_at.toISOString(),
    comments_count: post._count?.comments || 0,
  };
}
\`\`\`

## Key Conversion Patterns

### Django → Next.js Mapping

| Django Pattern | Next.js Equivalent | Notes |
|----------------|-------------------|-------|
| \`models.Model\` | TypeScript interface | Define shape, use ORM for persistence |
| \`viewsets.ModelViewSet\` | API route handlers | Split CRUD operations into separate functions |
| \`serializers.ModelSerializer\` | Zod schemas + transform functions | Runtime validation + type safety |
| \`permissions.IsAuthenticated\` | \`getServerSession()\` | Next-auth integration |
| \`Q()\` queries | Prisma where clauses | ORM-specific query building |
| \`@action\` decorators | Separate API endpoints | Custom routes for special operations |
| \`select_related/prefetch_related\` | \`include\` clauses | Eager loading relationships |

### Authentication Patterns

\`\`\`python
# Django authentication
from django.contrib.auth.decorators import login_required
from rest_framework.permissions import IsAuthenticated

@login_required
def profile_view(request):
    return render(request, 'profile.html', {'user': request.user})
\`\`\`

\`\`\`typescript
// Next.js authentication with middleware
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  return <ProfileComponent user={session.user} />;
}

// Middleware for protecting API routes
export async function requireAuth(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  return session;
}
\`\`\`

### Benefits of Next.js Conversion

1. **Type Safety**: End-to-end TypeScript types from API to frontend
2. **Performance**: Static generation and incremental regeneration
3. **Developer Experience**: Hot reloading, better debugging, single codebase
4. **Deployment**: Simpler deployment model with Vercel/similar platforms
5. **SEO**: Built-in SSR/SSG capabilities

This pattern is successfully used by companies migrating from Django monoliths to modern TypeScript-based JAMstack architectures.`,
    tags: ["django", "nextjs", "api-routes", "authentication", "migration"],
    language: "typescript" as const
  }
}; 