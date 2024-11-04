import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Developer",
      content: "This platform completely transformed my career. The courses are practical and well-structured.",
    },
    {
      name: "Michael Chen",
      role: "Data Analyst",
      content: "The quality of instruction is outstanding. I learned more in 3 months than I did in a year of self-study.",
    },
    {
      name: "Emma Williams",
      role: "UX Designer",
      content: "The community support and practical projects helped me land my dream job.",
    },
  ]

  return (
    <section className="py-20">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Students Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{testimonial.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
