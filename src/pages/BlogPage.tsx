import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { usePageContent } from "@/hooks/usePageContent";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import { format } from "date-fns";

export default function BlogPage() {
  const { posts, categories, isLoading } = useBlogPosts();
  const { page } = usePageContent("blog");

  const publishedPosts = posts?.filter(p => p.status === "published") || [];

  return (
    <>
      <Helmet>
        <title>{page?.page_title || "Blog | Trade Atlas"}</title>
        <meta name="description" content={page?.meta_description || "Insights, tips, and news about field operations."} />
        <link rel="canonical" href="https://runwithatlas.com/blog" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden hero-dark py-20 md:py-28">
        <div className="absolute inset-0 tech-lines opacity-30" />
        <div className="absolute top-20 right-10 w-3 h-3 rounded-full bg-primary animate-pulse" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/30 rounded-full">
              Blog
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {page?.hero_title || <>Trade Atlas <span className="text-gradient-gold">Blog</span></>}
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              {page?.hero_subtitle || "Insights and updates from the Trade Atlas team."}
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 gold-line" />
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-8 bg-muted/30 border-b">
          <div className="container px-4 md:px-6">
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">All</Badge>
              {categories.map((cat) => (
                <Badge 
                  key={cat.id} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary/20"
                  style={{ borderColor: cat.color }}
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Posts */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : publishedPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {publishedPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="h-full border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg group">
                    {post.featured_image_url && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img 
                          src={post.featured_image_url} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      {post.category && (
                        <Badge 
                          variant="outline" 
                          className="mb-3"
                          style={{ borderColor: post.category.color, color: post.category.color }}
                        >
                          {post.category.name}
                        </Badge>
                      )}
                      <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : "Draft"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.read_time_minutes} min read
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="max-w-xl mx-auto border-primary/20">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">
                  We're working on some great content. Check back soon for articles about 
                  field operations, industry insights, and Trade Atlas updates.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}
