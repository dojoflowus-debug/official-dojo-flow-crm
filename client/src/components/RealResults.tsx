import { testimonials, studioTypeLabels } from '@/data/testimonials';
import { Badge } from '@/components/ui/badge';

/**
 * Avatar component for testimonial cards
 */
function Avatar({ initials, name }: { initials: string; name: string }) {
  // Generate a consistent color based on initials
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
  ];

  const colorIndex = initials.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div
      className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center text-white font-semibold text-sm`}
      title={name}
    >
      {initials}
    </div>
  );
}

/**
 * TestimonialCard component
 */
function TestimonialCard({
  studioName,
  ownerName,
  ownerRole,
  studioType,
  quote,
  metric,
  imageInitials,
}: (typeof testimonials)[0]) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
      {/* Header with avatar and studio info */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar initials={imageInitials} name={ownerName} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground truncate">
            {studioName}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{ownerName}</p>
          <p className="text-xs text-muted-foreground">{ownerRole}</p>
        </div>
      </div>

      {/* Studio type badge */}
      <div className="mb-4">
        <Badge variant="secondary" className="text-xs">
          {studioTypeLabels[studioType]}
        </Badge>
      </div>

      {/* Quote */}
      <p className="text-sm text-card-foreground flex-1 mb-4 leading-relaxed">
        "{quote}"
      </p>

      {/* Metric highlight */}
      <div className="bg-accent/10 border border-accent/20 rounded-md p-3 mt-auto">
        <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
        <p className="text-2xl font-bold text-accent">{metric.value}</p>
      </div>
    </div>
  );
}

/**
 * RealResults section component
 * Displays testimonials from various studio types
 */
export function RealResults() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        {/* Section header */}
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Real Results from Real Schools
          </h2>
          <p className="text-lg text-muted-foreground">
            See how DojoFlow helps martial arts schools, kickboxing studios,
            boxing gyms, and yoga studios run better, grow faster, and retain
            more students.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} {...testimonial} />
          ))}
        </div>

        {/* CTA section */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6">
            Ready to see results at your studio?
          </p>
          <a
            href="/owner/signup"
            className="inline-block px-8 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Start Your Free Trial
          </a>
        </div>
      </div>
    </section>
  );
}
