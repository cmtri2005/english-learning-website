import { AdminLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import { Search, Plus, Edit2, Trash2, Eye } from "lucide-react";
import { useState } from "react";

interface Course {
  id: number;
  title: string;
  instructor: string;
  level: string;
  students: number;
  lessons: number;
  status: "Published" | "Draft" | "Archived";
  createdDate: string;
}

export default function AdminCourses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Published" | "Draft" | "Archived">("All");
  const [showAddForm, setShowAddForm] = useState(false);

  const courses: Course[] = [
    {
      id: 1,
      title: "English A1 Beginner",
      instructor: "Sarah Johnson",
      level: "A1",
      students: 342,
      lessons: 20,
      status: "Published",
      createdDate: "2024-01-15",
    },
    {
      id: 2,
      title: "Business English Pro",
      instructor: "Michael Davis",
      level: "B1",
      students: 289,
      lessons: 25,
      status: "Published",
      createdDate: "2024-01-20",
    },
    {
      id: 3,
      title: "IELTS Preparation",
      instructor: "Emma Wilson",
      level: "B2",
      students: 156,
      lessons: 30,
      status: "Draft",
      createdDate: "2024-02-10",
    },
    {
      id: 4,
      title: "Conversational English",
      instructor: "Robert Brown",
      level: "A2",
      students: 421,
      lessons: 22,
      status: "Published",
      createdDate: "2024-01-08",
    },
    {
      id: 5,
      title: "Advanced Writing Skills",
      instructor: "Lisa Anderson",
      level: "B2",
      students: 0,
      lessons: 18,
      status: "Draft",
      createdDate: "2024-02-25",
    },
    {
      id: 6,
      title: "Listening Comprehension",
      instructor: "Tom Wilson",
      level: "A2",
      students: 213,
      lessons: 20,
      status: "Published",
      createdDate: "2023-12-10",
    },
  ];

  const filteredCourses = courses.filter((course) => {
    const matchSearch = course.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === "All" || course.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-green-100 text-green-700";
      case "Draft":
        return "bg-yellow-100 text-yellow-700";
      case "Archived":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "A1":
        return "bg-blue-100 text-blue-700";
      case "A2":
        return "bg-blue-100 text-blue-700";
      case "B1":
        return "bg-purple-100 text-purple-700";
      case "B2":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Course Management</h2>
            <p className="text-muted-foreground">
              Create, edit, and manage all courses on your platform
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={18} />
            Create Course
          </Button>
        </div>

        {/* Create Course Form */}
        {showAddForm && (
          <div className="p-6 rounded-xl border bg-background space-y-4">
            <h3 className="text-lg font-bold">Create New Course</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Course Title"
                className="px-4 py-2 border rounded-lg bg-background"
              />
              <select className="px-4 py-2 border rounded-lg bg-background">
                <option>Select Instructor</option>
                <option>Sarah Johnson</option>
                <option>Michael Davis</option>
                <option>Emma Wilson</option>
              </select>
              <select className="px-4 py-2 border rounded-lg bg-background">
                <option>Select Level</option>
                <option>A1</option>
                <option>A2</option>
                <option>B1</option>
                <option>B2</option>
              </select>
              <input
                type="number"
                placeholder="Number of Lessons"
                className="px-4 py-2 border rounded-lg bg-background"
              />
            </div>
            <textarea
              placeholder="Course Description"
              className="w-full px-4 py-2 border rounded-lg bg-background"
              rows={4}
            />
            <div className="flex gap-3">
              <Button className="bg-primary">Create Course</Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border rounded-lg bg-background"
          >
            <option>All Status</option>
            <option>Published</option>
            <option>Draft</option>
            <option>Archived</option>
          </select>
        </div>

        {/* Courses Table */}
        <div className="rounded-xl border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Lessons
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <span className="font-semibold">{course.title}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {course.instructor}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${getLevelColor(
                          course.level
                        )}`}
                      >
                        {course.level}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">{course.lessons}</td>
                    <td className="px-6 py-3 text-sm font-semibold">
                      {course.students}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(
                          course.status
                        )}`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {course.createdDate}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border bg-background">
            <p className="text-sm text-muted-foreground">Total Courses</p>
            <p className="text-2xl font-bold">{courses.length}</p>
          </div>
          <div className="p-4 rounded-lg border bg-background">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-2xl font-bold text-green-600">
              {courses.filter((c) => c.status === "Published").length}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-background">
            <p className="text-sm text-muted-foreground">Drafts</p>
            <p className="text-2xl font-bold text-yellow-600">
              {courses.filter((c) => c.status === "Draft").length}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-background">
            <p className="text-sm text-muted-foreground">Total Enrollments</p>
            <p className="text-2xl font-bold">
              {courses.reduce((sum, c) => sum + c.students, 0)}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
