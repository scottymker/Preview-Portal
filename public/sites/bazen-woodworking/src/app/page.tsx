import Image from 'next/image';
import Link from 'next/link';

// Featured projects for the homepage
const featuredProjects = [
  { src: '/images/IMG_6655.jpg', alt: 'Modern kitchen with custom range hood', category: 'Kitchen' },
  { src: '/images/IMG_9881.jpg', alt: 'Custom closet organization system', category: 'Closet' },
  { src: '/images/IMG_6712.jpg', alt: 'Custom bar cabinet with wine storage', category: 'Storage' },
  { src: '/images/IMG_6977.jpg', alt: 'Custom bathroom vanity with LED mirrors', category: 'Bathroom' },
  { src: '/images/IMG_6744.jpg', alt: 'Built-in window seat and bookshelves', category: 'Storage' },
  { src: '/images/IMG_6641.jpg', alt: 'Kitchen with island seating', category: 'Kitchen' },
];

const services = [
  {
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: 'Custom Kitchens',
    description: 'Transform your kitchen with custom cabinets designed to fit your space perfectly. From modern to traditional styles.',
  },
  {
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'Closet Systems',
    description: 'Maximize your storage with custom closet solutions. Walk-ins, reach-ins, and organization systems built to last.',
  },
  {
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: 'Built-In Storage',
    description: 'Custom built-ins that blend seamlessly with your home. Entertainment centers, bookshelves, and more.',
  },
  {
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    title: 'Bathroom Vanities',
    description: 'Beautiful custom vanities crafted to your specifications. Quality materials and expert construction.',
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Consultation & Design',
    description: 'We start by understanding your vision and space, then Steve creates detailed plans tailored to your needs and style.',
  },
  {
    number: '02',
    title: 'Crafting',
    description: 'Your custom pieces are handcrafted in our workshop with precision, quality materials, and meticulous care.',
  },
  {
    number: '03',
    title: 'Installation',
    description: 'Professional installation ensures a perfect fit and flawless finish in your home.',
  },
];

const testimonials = [
  {
    quote: "Steve transformed our kitchen beyond our expectations. His attention to detail and craftsmanship is unmatched. We couldn't be happier!",
    author: 'Sarah & Mike Johnson',
    location: 'Mitchell, SD',
  },
  {
    quote: "Professional from start to finish. Steve listened to exactly what we wanted and delivered a beautiful custom closet system.",
    author: 'Jennifer Davis',
    location: 'Corsica, SD',
  },
  {
    quote: "The quality of work is outstanding. Our new cabinets have completely changed the look and feel of our home.",
    author: 'Robert Thompson',
    location: 'Sioux Falls, SD',
  },
];

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen min-h-[700px] flex items-center">
        <Image
          src="/images/IMG_9853.jpg"
          alt="Beautiful custom kitchen by Bazen Woodworking"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Content box with border and blurred backdrop */}
          <div className="inline-block border border-white/30 rounded-lg p-8 md:p-12 bg-black/50 backdrop-blur-[2px] shadow-2xl shadow-black/50">
            <p className="section-subtitle text-white mb-4 animate-fade-in-up">
              Crafted with Pride in South Dakota
            </p>
            <h1
              className="text-4xl md:text-5xl lg:text-7xl font-light mb-6 text-white animate-fade-in-up"
              style={{ fontFamily: 'var(--font-playfair), serif', animationDelay: '100ms' }}
            >
              Custom Cabinets &<br />
              <span className="text-[#c4a35a]">Fine Woodwork</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-xl mb-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              Over 20 years of experience crafting beautiful, functional spaces
              for homes across South Dakota.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <Link href="/contact" className="btn-primary">
                Call Now
              </Link>
              <Link href="/gallery" className="btn-outline-white">
                View Our Work
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-center animate-bounce">
          <p className="text-xs tracking-widest mb-2 uppercase">Scroll</p>
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="section-subtitle">What We Do</p>
            <h2 className="section-title">Expert Craftsmanship for Every Room</h2>
            <p className="text-[#6b6b6b] mt-4">
              From custom kitchens to closet systems, we bring your vision to life with
              quality materials and meticulous attention to detail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-lg hover:bg-[#f5f3ef] transition-colors duration-300 group"
              >
                <div className="text-[#c4a35a] mb-6 flex justify-center group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#3d3d3d] mb-3">{service.title}</h3>
                <p className="text-[#6b6b6b] text-sm leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Work Section */}
      <section className="section-padding bg-[#f5f3ef]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="section-subtitle">Our Portfolio</p>
              <h2 className="section-title">Featured Projects</h2>
            </div>
            <Link href="/gallery" className="btn-outline self-start md:self-auto">
              View All Projects
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project, index) => (
              <Link
                href="/gallery"
                key={index}
                className="group relative aspect-[4/3] image-hover rounded-lg"
              >
                <Image
                  src={project.src}
                  alt={project.alt}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 rounded-lg flex items-end p-6">
                  <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="text-[#c4a35a] text-sm font-medium">{project.category}</span>
                    <p className="text-white font-medium mt-1">{project.alt}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <div className="relative">
              <div className="relative aspect-[3/4] max-w-md mx-auto lg:mx-0">
                <Image
                  src="/images/IMG_5992.jpg"
                  alt="Steve Bazen - Owner of Bazen Woodworking"
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              {/* Experience badge */}
              <div className="absolute -bottom-6 -right-6 md:right-0 bg-[#c4a35a] text-white p-6 rounded-lg shadow-xl">
                <p className="text-4xl font-bold" style={{ fontFamily: 'var(--font-playfair), serif' }}>20+</p>
                <p className="text-sm uppercase tracking-wider">Years Experience</p>
              </div>
            </div>

            {/* Content */}
            <div>
              <p className="section-subtitle">Meet the Craftsman</p>
              <h2 className="section-title">Steve Bazen</h2>
              <p className="text-[#6b6b6b] leading-relaxed mb-6">
                With over two decades of experience in custom woodworking, Steve Bazen has built
                a reputation for quality craftsmanship and exceptional attention to detail.
                What started as a passion for working with wood has grown into a thriving
                business serving families throughout South Dakota.
              </p>
              <p className="text-[#6b6b6b] leading-relaxed mb-8">
                Every project that leaves the Bazen Woodworking shop reflects Steve&apos;s commitment
                to quality. From the initial consultation to the final installation, you&apos;ll work
                directly with Steve to ensure your vision becomes reality.
              </p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-3xl font-bold text-[#c4a35a]" style={{ fontFamily: 'var(--font-playfair), serif' }}>150+</p>
                  <p className="text-sm text-[#6b6b6b]">Projects Completed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#c4a35a]" style={{ fontFamily: 'var(--font-playfair), serif' }}>100%</p>
                  <p className="text-sm text-[#6b6b6b]">Client Satisfaction</p>
                </div>
              </div>

              <Link href="/about" className="btn-outline">
                Learn More About Steve
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-padding bg-[#3d3d3d] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="section-subtitle">How We Work</p>
            <h2 className="section-title !text-white">Our Simple Process</h2>
            <p className="text-gray-400 mt-4">
              From your first call to the final installation, we make the custom cabinet
              experience smooth and enjoyable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {processSteps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="text-6xl font-bold text-[#c4a35a]/20 mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>

                {/* Connector line */}
                {index < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-[#c4a35a]/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="section-subtitle">Testimonials</p>
            <h2 className="section-title">What Our Clients Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-[#f5f3ef] p-8 rounded-lg">
                {/* Quote icon */}
                <svg className="w-10 h-10 text-[#c4a35a] mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-[#3d3d3d] leading-relaxed mb-6">{testimonial.quote}</p>
                <div>
                  <p className="font-semibold text-[#3d3d3d]">{testimonial.author}</p>
                  <p className="text-sm text-[#6b6b6b]">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6">
        <Image
          src="/images/IMG_5966.jpg"
          alt="Bazen Woodworking workshop"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#3d3d3d]/85" />
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-light mb-6"
            style={{ fontFamily: 'var(--font-playfair), serif' }}
          >
            Ready to Transform Your Space?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Let&apos;s discuss your project. Contact Steve today to start planning
            your custom cabinet project.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="btn-primary">
              Get Started Today
            </Link>
            <a href="tel:605-553-3304" className="btn-outline-white">
              Call 605-553-3304
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
