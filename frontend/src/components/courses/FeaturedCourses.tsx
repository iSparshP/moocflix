import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function FeaturedCourses() {
  const featuredCourses = [
    {
      title: "Web Development Bootcamp",
      description: "Learn full-stack development from scratch",
      image: "/images/web-dev.jpg",
    },
    {
      title: "Data Science Fundamentals",
      description: "Master data analysis and visualization",
      image: "/images/data-science.jpg",
    },
    {
      title: "UI/UX Design",
      description: "Create beautiful and functional interfaces",
      image: "/images/ui-ux.jpg",
    },
  ]

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-12">Featured Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.map((course, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{course.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
