import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Zap, Play, Clock, TrendingUp, CheckCircle2, DollarSign, ChevronDown, ChevronUp, Star, ShieldCheck, Lock, Twitter, Instagram, Youtube, Users, MessageSquare, Calendar } from 'lucide-react';
import { COURSE_CONTENT, COURSE_PRICE_KWD, FAQS, TESTIMONIALS } from '../constants';

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen pt-20 overflow-x-hidden bg-[#0a0a0a] text-white font-body">
      {/* Hero Section */}
      <header className="relative py-20 md:py-32 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="relative z-10 order-2 md:order-1 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-[#CCFF00]/30 bg-[#CCFF00]/10 skew-x-[-10deg]">
            <span className="w-2 h-2 bg-[#CCFF00] animate-pulse skew-x-[10deg]"></span>
            <span className="text-[#CCFF00] text-sm font-bold tracking-wide skew-x-[10deg]">نظام الـ ٧ أيام للإطلاق</span>
          </div>
          <h1 className="font-display font-black text-5xl md:text-7xl leading-[1.1] mb-8 text-white">
            اصنع تطبيقك.<br/>
            <span className="text-[#CCFF00]">ضاعف دخلك.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-lg leading-relaxed border-r-2 border-[#CCFF00] pr-4">
            توقف عن الحلم وابدأ التنفيذ. منهجية عملية ومكثفة لإطلاق مشروعك التقني المربح في أسبوع واحد فقط، دون الحاجة لخبرة برمجية مسبقة.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button className="w-full">
                ابدأ الآن مجاناً
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                تسجيل الدخول
              </Button>
            </Link>
          </div>
          
          <div className="mt-10 flex items-center gap-4 text-sm text-gray-500 border-t border-[#333] pt-6 max-w-md">
            <div className="flex -space-x-3 rtl:space-x-reverse">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#111] bg-gray-800 bg-cover bg-center grayscale hover:grayscale-0 transition-all" style={{backgroundImage: `url('https://i.pravatar.cc/100?img=${i + 10}')`}} />
              ))}
            </div>
            <p>انضم إلينا أكثر من <span className="text-white font-bold">١,٢٠٤ مشترك</span></p>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative z-0 h-full min-h-[400px] flex items-center justify-center order-1 md:order-2">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#CCFF00]/20 to-transparent rounded-full blur-[100px]" />
            <div className="relative w-full max-w-md aspect-square bg-[#111] border border-[#333] p-2 transform -rotate-2 hover:rotate-0 transition-transform duration-700 shadow-2xl">
                <div className="w-full h-full bg-[#0a0a0a] flex flex-col relative overflow-hidden group border border-[#222]">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80')] bg-cover opacity-20 mix-blend-overlay"></div>
                   
                   <div className="absolute bottom-8 right-8 left-8 z-10">
                       <div className="bg-[#111]/90 backdrop-blur-xl p-6 border border-[#333] shadow-[8px_8px_0px_#CCFF00]">
                           <div className="flex items-center justify-between mb-4">
                               <div>
                                   <p className="text-xs text-[#CCFF00] font-bold uppercase tracking-widest mb-1">الإيرادات اليومية</p>
                                   <h3 className="text-3xl font-display font-bold text-white">١٤٥.٥٠٠ د.ك</h3>
                               </div>
                               <div className="w-12 h-12 bg-[#CCFF00]/20 text-[#CCFF00] flex items-center justify-center">
                                   <TrendingUp size={24} />
                               </div>
                           </div>
                           <div className="space-y-2">
                               <div className="h-2 bg-[#222] overflow-hidden">
                                   <div className="h-full bg-[#CCFF00] w-[75%]"></div>
                               </div>
                               <div className="flex justify-between text-xs text-gray-500 font-medium">
                                   <span>المستهدف</span>
                                   <span>٧٥٪</span>
                               </div>
                           </div>
                       </div>
                   </div>
                </div>
            </div>
        </div>
      </header>

      {/* Value Props */}
      <section className="py-24 bg-[#0F0F0F] border-y border-[#222]">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
            {[
                { icon: Zap, title: "سرعة التنفيذ", desc: "لا تضيع شهوراً في التطوير. نظامنا مصمم لإطلاق النسخة الأولى في ٧ أيام." },
                { icon: DollarSign, title: "التركيز على الربح", desc: "لا نعلمك البرمجة للهواية. نعلمك كيف تبني منتجاً يدفع الناس المال مقابله." },
                { icon: Clock, title: "وفر آلاف الدنانير", desc: "بدلاً من دفع ٥٠٠٠ د.ك لشركات البرمجة، اصنع تطبيقك بنفسك بأقل التكاليف." }
            ].map((item, i) => (
                <div key={i} className="group p-8 bg-[#161616] border border-[#333] hover:border-[#CCFF00] transition-all duration-300 relative overflow-hidden">
                    <div className="w-14 h-14 bg-[#CCFF00]/10 text-[#CCFF00] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-[#CCFF00]/20">
                        <item.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 font-display">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Curriculum Section */}
      <section id="curriculum" className="py-32 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
            <span className="text-[#CCFF00] font-bold tracking-wider uppercase text-sm mb-2 block">المنهج الدراسي</span>
            <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6">رحلتك خلال ٧ أيام</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">خريطة طريق واضحة. خطوة بخطوة. لا حشو ولا نظريات مملة.</p>
        </div>

        <div className="space-y-6">
            {COURSE_CONTENT.map((module, i) => (
                <div key={module.id} className="bg-[#111] border border-[#333] hover:border-[#CCFF00]/50 transition-colors group relative overflow-hidden">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start gap-6">
                        {/* Day Badge */}
                        <div className="flex-shrink-0">
                           <div className="w-16 h-16 rounded-full bg-[#0a0a0a] border border-[#333] flex items-center justify-center text-lg font-black text-[#CCFF00] group-hover:bg-[#CCFF00] group-hover:text-black transition-colors shadow-lg">
                             {i === 0 ? '١' : i === 1 ? '٢-٣' : i === 2 ? '٤-٥' : i === 3 ? '٦' : '٧'}
                           </div>
                        </div>
                        
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-[#CCFF00] transition-colors">
                              {module.title.split(':')[1] || module.title}
                            </h3>
                            <div className="space-y-3">
                                {module.lessons.map(l => (
                                    <div key={l.id} className="flex items-center gap-3 text-sm text-gray-400">
                                        <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                                          <Play className="w-3 h-3 text-[#CCFF00] fill-current" />
                                        </div>
                                        <span>{l.title}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-[#222] flex items-center gap-2 text-xs font-bold text-gray-500">
                                <Clock size={12} />
                                <span>{module.lessons.length} دروس</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-[#111] text-white relative overflow-hidden border-y border-[#333]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00] rounded-full blur-[150px] opacity-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">قصص نجاح ملهمة</h2>
            <p className="text-gray-400 text-lg">انضم لمئات الناجحين الذين غيروا حياتهم</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className="bg-[#161616] border border-[#333] p-8 hover:border-[#CCFF00] transition-colors relative">
                <div className="flex items-center gap-1 text-[#CCFF00] mb-6">
                  {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-gray-300 leading-relaxed mb-8 min-h-[80px]">"{t.content}"</p>
                <div className="flex items-center gap-4 border-t border-[#333] pt-6">
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 grayscale rounded-full border border-[#CCFF00]" />
                  <div>
                    <h4 className="font-bold text-white text-sm">{t.name}</h4>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-[#0a0a0a] border-b border-[#333]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-white mb-2">أسئلة شائعة</h2>
            <p className="text-gray-500">كل ما تحتاج معرفته قبل البدء</p>
          </div>
          
          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <div key={index} className="border border-[#333] bg-[#111] transition-all duration-300 hover:border-[#333]">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-right hover:bg-[#161616] transition-colors focus:outline-none"
                >
                  <span className={`font-bold transition-colors ${openFaq === index ? 'text-[#CCFF00]' : 'text-white'}`}>
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="text-[#CCFF00]" />
                  ) : (
                    <ChevronDown className="text-gray-600" />
                  )}
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaq === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-[#333]/50">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#111] to-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-[#CCFF00]/30 bg-[#CCFF00]/10">
              <Users className="w-5 h-5 text-[#CCFF00]" />
              <span className="text-[#CCFF00] text-sm font-bold tracking-wide">انضم للمجتمع</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6">
              تواصل مع مجتمع المبرمجين
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
              انضم لمجتمع حيوي من المبرمجين والمبدعين. شارك أفكارك، اطرح أسئلتك، واحصل على الدعم من خبراء ومتعلمين مثلك.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="group p-8 bg-[#161616] border border-[#333] hover:border-[#CCFF00] transition-all duration-300">
              <div className="w-14 h-14 bg-[#CCFF00]/10 text-[#CCFF00] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-[#CCFF00]/20">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-display">منشورات ونقاشات</h3>
              <p className="text-gray-400 leading-relaxed">شارك خبراتك واطرح أسئلتك في منتدى تفاعلي مع آلاف الأعضاء</p>
            </div>

            <div className="group p-8 bg-[#161616] border border-[#333] hover:border-[#CCFF00] transition-all duration-300">
              <div className="w-14 h-14 bg-[#CCFF00]/10 text-[#CCFF00] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-[#CCFF00]/20">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-display">فعاليات حصرية</h3>
              <p className="text-gray-400 leading-relaxed">احضر ورش عمل مباشرة وجلسات أسئلة وأجوبة مع خبراء الصناعة</p>
            </div>

            <div className="group p-8 bg-[#161616] border border-[#333] hover:border-[#CCFF00] transition-all duration-300">
              <div className="w-14 h-14 bg-[#CCFF00]/10 text-[#CCFF00] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-[#CCFF00]/20">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-display">موارد مجانية</h3>
              <p className="text-gray-400 leading-relaxed">احصل على ملفات وقوالب ومصادر مجانية لتسريع مشاريعك</p>
            </div>
          </div>

          <div className="text-center">
            <Link to="/community">
              <Button className="py-6 px-16 text-xl shadow-[0_0_30px_rgba(204,255,0,0.2)] hover:shadow-[0_0_50px_rgba(204,255,0,0.4)]">
                انضم للمجتمع مجاناً
              </Button>
            </Link>
            <p className="text-gray-500 text-sm mt-4">متاح لجميع المستخدمين • بدون رسوم</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 relative overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-[#111]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="mb-8 inline-block p-3 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20">
                <Zap className="w-8 h-8 text-[#CCFF00] fill-current animate-pulse" />
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-6 leading-tight">
                ابدأ رحلتك اليوم
            </h2>
            <p className="text-gray-400 text-xl md:text-2xl mb-10 max-w-2xl mx-auto">
                انضم لمئات الذين حولوا أفكارهم لتطبيقات حقيقية وحققوا دخلهم الأول.
            </p>
            
            <div className="flex flex-col items-center gap-8">
                <Link to="/checkout" className="w-full sm:w-auto">
                    <Button className="py-6 px-16 text-xl w-full sm:w-auto shadow-[0_0_30px_rgba(204,255,0,0.2)] hover:shadow-[0_0_50px_rgba(204,255,0,0.4)]">
                        اشترك الآن بـ {COURSE_PRICE_KWD} د.ك
                    </Button>
                </Link>
                
                <div className="flex flex-col sm:flex-row items-center gap-6 text-sm font-bold text-gray-500">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#CCFF00]" />
                        <span>ضمان استرداد ١٤ يوم</span>
                    </div>
                    <div className="hidden sm:block w-1 h-1 bg-gray-700 rounded-full"></div>
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#CCFF00]" />
                        <span>دفع آمن ١٠٠٪</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050505] border-t border-[#222] py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link to="/" className="font-display font-black text-2xl tracking-tighter text-white">
                7-DAY<span className="text-[#CCFF00]">APP</span>
            </Link>
            <p className="text-gray-600 text-sm">© 2025 7DayApp. جميع الحقوق محفوظة.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500 font-bold">
            <a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a>
            <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-white transition-colors">تواصل معنا</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-gray-500 hover:text-[#CCFF00] hover:border-[#CCFF00] transition-all">
                <Twitter size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-gray-500 hover:text-[#CCFF00] hover:border-[#CCFF00] transition-all">
                <Instagram size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-gray-500 hover:text-[#CCFF00] hover:border-[#CCFF00] transition-all">
                <Youtube size={18} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};