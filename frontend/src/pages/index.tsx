import { Link } from "react-router-dom";
import { AppLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import { ArrowRight, FileText, Mic, PenLine, BookOpen, CheckCircle, Sparkles } from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: FileText,
      title: "Đề thi TOEIC",
      desc: "Hơn 200 đề Listening & Reading với chấm điểm tự động và phân tích chi tiết kết quả.",
      link: "/exams",
      color: "from-blue-500/10 to-cyan-500/10",
    },
    {
      icon: Mic,
      title: "Luyện Speaking",
      desc: "Tra phát âm từ vựng và luyện nói theo chủ đề với AI đánh giá.",
      link: "/practice",
      color: "from-violet-500/10 to-purple-500/10",
    },
    {
      icon: PenLine,
      title: "Luyện Writing",
      desc: "Viết essay với đề thi thực tế, nhận feedback về grammar và vocabulary.",
      link: "/practice",
      color: "from-orange-500/10 to-amber-500/10",
    },
    {
      icon: BookOpen,
      title: "Blog",
      desc: "Chia sẻ kinh nghiệm học tiếng Anh và tips thi TOEIC từ cộng đồng.",
      link: "/blog",
      color: "from-emerald-500/10 to-green-500/10",
    },
  ];

  const benefits = [
    "Miễn phí hoàn toàn",
    "Không cần thẻ tín dụng",
    "AI chấm điểm tự động",
    "Theo dõi tiến độ",
  ];

  return (
    <AppLayout>
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-6 py-24 md:py-32">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
                <Sparkles className="h-4 w-4" />
                Học tiếng Anh thông minh hơn
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Luyện thi TOEIC
                <br />
                <span className="text-muted-foreground">cùng AI</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Làm đề thi thực tế, luyện Speaking & Writing với feedback từ AI,
                và theo dõi tiến độ học tập của bạn.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8">
                    Bắt đầu miễn phí
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/exams">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
                    Xem đề thi
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {benefits.map((benefit, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/20">
          <div className="container mx-auto px-6 py-20">
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Đầy đủ công cụ để cải thiện tiếng Anh
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Từ làm đề thi đến luyện nói, viết - tất cả trong một nền tảng
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {features.map((feature, i) => (
                <Link
                  key={i}
                  to={feature.link}
                  className="group relative p-6 rounded-2xl border bg-background hover:shadow-lg transition-all duration-300"
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-background transition-colors">
                      <feature.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t">
          <div className="container mx-auto px-6 py-20">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Sẵn sàng nâng cao tiếng Anh?
              </h2>
              <p className="text-muted-foreground mb-8">
                Tham gia cùng hàng nghìn người học đang luyện thi TOEIC mỗi ngày
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto px-8">
                    Tạo tài khoản miễn phí
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                    Đã có tài khoản? Đăng nhập
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
