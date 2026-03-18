import { Helmet } from "react-helmet-async";
import { Link, useParams, Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import { format } from "date-fns";
import DOMPurify from "dompurify";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { post, isLoadingPost } = useBlogPosts(slug);

  if (isLoadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{post.title} | Trade Atlas Blog</title>
        <meta name="description" content={post.meta_description || post.excerpt || post.title} />
        <link rel="canonical" href={`https://runwithatlas.com/blog/${post.slug}`} />
        {post.featured_image_url && <meta property="og:image" content={post.featured_image_url} />}
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden hero-dark py-16 md:py-24">
        <div className="absolute inset-0 tech-lines opacity-30" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto">
            <Link to="/blog" className="inline-flex items-center gap-2 text-white/70 hover:text-primary mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
            
            {post.category && (
              <Badge 
                variant="outline" 
                className="mb-4"
                style={{ borderColor: post.category.color, color: post.category.color }}
              >
                {post.category.name}
              </Badge>
            )}
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-white/70">
              <div className="flex items-center gap-2">
                {post.author_avatar_url && (
                  <img src={post.author_avatar_url} alt={post.author_name} className="h-8 w-8 rounded-full" />
                )}
                <span>{post.author_name}</span>
              </div>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {post.published_at ? format(new Date(post.published_at), "MMMM d, yyyy") : "Draft"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.read_time_minutes} min read
              </span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 gold-line" />
      </section>

      {/* Featured Image */}
      {post.featured_image_url && (
        <div className="container px-4 md:px-6 -mt-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <img 
              src={post.featured_image_url} 
              alt={post.title}
              className="w-full aspect-video object-cover rounded-xl shadow-xl"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <article className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content, {
              ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre', 'img', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
              ALLOWED_ATTR: ['href', 'class', 'src', 'alt', 'title', 'target', 'rel'],
              ALLOW_DATA_ATTR: false
            }) }} />
          </article>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="max-w-3xl mx-auto mt-8 pt-8 border-t">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <div className="max-w-3xl mx-auto mt-8 flex justify-between items-center">
            <Link to="/blog">
              <Button variant="outline" className="border-primary/50 gap-2">
                <ArrowLeft className="h-4 w-4" />
                All Posts
              </Button>
            </Link>
            <Button variant="outline" className="border-primary/50 gap-2" onClick={() => navigator.share?.({ url: window.location.href, title: post.title })}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
