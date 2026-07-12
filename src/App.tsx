import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy } from "react";
import { Layout } from "@/components/Layout";

// Lazy load components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Series = lazy(() => import("./pages/Series"));
const Newsletter = lazy(() => import("./pages/Newsletter"));
const About = lazy(() => import("./pages/About"));
const Connect = lazy(() => import("./pages/Connect"));
const Admin = import.meta.env.DEV ? lazy(() => import("./pages/Admin")) : null;
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Layout>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/playlists/:playlistSlug" element={<Series />} />
              <Route path="/series/:seriesSlug" element={<Series />} />
              <Route path="/newsletter" element={<Newsletter />} />
              <Route path="/about" element={<About />} />
              <Route path="/connect" element={<Connect />} />
              {Admin && <Route path="/admin" element={<Admin />} />}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </TooltipProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
