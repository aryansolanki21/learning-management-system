import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useGetInstructorDashboardQuery } from "@/features/api/analyticsApi.js";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CircleDollarSign,
  GraduationCap,
  Plus,
  RefreshCw,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RANGE_LABELS = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value) || 0);

const formatChartLabel = (value, range) => {
  if (!value) {
    return "";
  }

  const date =
    range === "all"
      ? new Date(`${value}-01T00:00:00`)
      : new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    ...(range === "all" ? { year: "2-digit" } : { day: "numeric" }),
  }).format(date);
};

const formatSaleDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getInitials = (name) =>
  (name || "Student")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const MetricChange = ({ change }) => {
  if (change === null || change === undefined) {
    return (
      <span className="text-xs font-medium text-muted-foreground">
        New activity this period
      </span>
    );
  }

  const isPositive = change > 0;
  const isNegative = change < 0;

  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : null;

  const colorClass = isPositive
    ? "text-emerald-600"
    : isNegative
      ? "text-red-600"
      : "text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${colorClass}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {Math.abs(change).toFixed(1)}% vs previous period
    </span>
  );
};

const MetricCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  change,
  showChange = false,
}) => (
  <Card className="border-border/70 shadow-sm transition-shadow duration-200 hover:shadow-md">
    <CardContent className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          <h2 className="mt-3 break-words text-2xl font-bold tracking-tight sm:text-3xl">
            {value}
          </h2>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 min-h-5">
        {showChange ? (
          <MetricChange change={change} />
        ) : (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </CardContent>
  </Card>
);

const DashboardSkeleton = () => (
  <div className="space-y-8">
    <div className="space-y-2">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted" />
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-xl border bg-muted/30"
        />
      ))}
    </div>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="h-96 animate-pulse rounded-xl border bg-muted/30 xl:col-span-2" />
      <div className="h-96 animate-pulse rounded-xl border bg-muted/30" />
    </div>

    <div className="h-80 animate-pulse rounded-xl border bg-muted/30" />
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();

  const [range, setRange] = useState("30d");
  const [chartMetric, setChartMetric] = useState("revenue");

  const { data, isLoading, isFetching, isError, refetch } =
    useGetInstructorDashboardQuery(range, {
      refetchOnMountOrArgChange: true,
    });

  if (isLoading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-7xl p-4 sm:p-6 lg:p-8">
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data?.success) {
    return (
      <div className="mx-auto flex min-h-96 w-full min-w-0 max-w-7xl items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <BarChart3 className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              Unable to load dashboard
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't retrieve your instructor analytics. Please try again.
            </p>

            <Button
              className="mt-5"
              variant="outline"
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overview = data.overview;
  const coursePerformance = data.coursePerformance || [];
  const revenueTrend = data.revenueTrend || [];
  const recentSales = data.recentSales || [];

  const chartHasData = revenueTrend.some(
    (point) => point.revenue > 0 || point.sales > 0,
  );

  const totalCourses = overview.totalCourses || 0;
  const publishedCourses = overview.publishedCourses || 0;
  const draftCourses = overview.draftCourses || 0;

  const publishedPercentage =
    totalCourses > 0 ? (publishedCourses / totalCourses) * 100 : 0;

  const draftPercentage =
    totalCourses > 0 ? (draftCourses / totalCourses) * 100 : 0;

  const chartColor = chartMetric === "revenue" ? "#2563eb" : "#0f766e";

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <GraduationCap className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="wrap-break-word text-2xl font-bold tracking-tight sm:text-3xl">
                Instructor Dashboard
              </h1>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Monitor your revenue, student activity, and course performance.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh dashboard"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>

          <Button onClick={() => navigate("/admin/course/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Revenue"
          value={formatCurrency(overview.totalRevenue)}
          description="Completed purchases"
          icon={CircleDollarSign}
          iconClassName="bg-blue-50 text-blue-700"
          change={overview.revenueChange}
          showChange={range !== "all"}
        />

        <MetricCard
          title="Course Sales"
          value={formatNumber(overview.totalSales)}
          description="Completed purchases"
          icon={ShoppingCart}
          iconClassName="bg-emerald-50 text-emerald-700"
          change={overview.salesChange}
          showChange={range !== "all"}
        />

        <MetricCard
          title="Students"
          value={formatNumber(overview.totalStudents)}
          description="Unique buyers in selected period"
          icon={Users}
          iconClassName="bg-violet-50 text-violet-700"
          change={overview.studentsChange}
          showChange={range !== "all"}
        />

        <MetricCard
          title="Average Rating"
          value={
            overview.totalReviews > 0
              ? `${Number(overview.averageRating).toFixed(1)} / 5`
              : "—"
          }
          description={
            overview.totalReviews > 0
              ? `${formatNumber(overview.totalReviews)} reviews across your courses`
              : "Your courses have no reviews yet"
          }
          icon={Star}
          iconClassName="bg-amber-50 text-amber-700"
        />
      </section>

      {/* Revenue chart and course status */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="min-w-0 shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Performance Overview</CardTitle>

              <CardDescription className="mt-1">
                Track completed sales and revenue over time.
              </CardDescription>
            </div>

            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>

          <CardContent>
            <div className="mb-5 flex gap-2">
              <Button
                size="sm"
                variant={chartMetric === "revenue" ? "default" : "outline"}
                onClick={() => setChartMetric("revenue")}
              >
                Revenue
              </Button>

              <Button
                size="sm"
                variant={chartMetric === "sales" ? "default" : "outline"}
                onClick={() => setChartMetric("sales")}
              >
                Sales
              </Button>
            </div>

            {chartHasData ? (
              <div className="h-[280px] w-full sm:h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueTrend}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 5,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="dashboardTrendFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={chartColor}
                          stopOpacity={0.24}
                        />

                        <stop
                          offset="95%"
                          stopColor={chartColor}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />

                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => formatChartLabel(value, range)}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      interval={
                        range === "7d"
                          ? 0
                          : range === "30d"
                            ? 4
                            : range === "90d"
                              ? 13
                              : "preserveStartEnd"
                      }
                    />

                    <YAxis
                      width={70}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        chartMetric === "revenue"
                          ? `₹${new Intl.NumberFormat("en-IN", {
                              notation: "compact",
                              maximumFractionDigits: 1,
                            }).format(value)}`
                          : formatNumber(value)
                      }
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      }}
                      labelFormatter={(value) => formatChartLabel(value, range)}
                      formatter={(value) => [
                        chartMetric === "revenue"
                          ? formatCurrency(value)
                          : formatNumber(value),
                        chartMetric === "revenue" ? "Revenue" : "Sales",
                      ]}
                    />

                    <Area
                      type="monotone"
                      dataKey={chartMetric}
                      stroke={chartColor}
                      strokeWidth={2.5}
                      fill="url(#dashboardTrendFill)"
                      activeDot={{
                        r: 5,
                        strokeWidth: 0,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center sm:h-[330px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>

                <h3 className="mt-4 font-semibold">No sales in this period</h3>

                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Completed purchases will appear here. Share your published
                  courses to start building your sales history.
                </p>

                <Button
                  className="mt-4"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/course")}
                >
                  Manage Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              {RANGE_LABELS[range]} · Revenue includes completed purchases only.
            </p>
          </CardContent>
        </Card>

        {/* Course status */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Course Overview</CardTitle>

            <CardDescription>
              Your current course publishing status.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">Total courses</p>

              <p className="mt-1 text-3xl font-bold">
                {formatNumber(totalCourses)}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  Published
                </span>

                <span className="font-semibold">{publishedCourses}</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${publishedPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Drafts
                </span>

                <span className="font-semibold">{draftCourses}</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${draftPercentage}%` }}
                />
              </div>
            </div>

            {draftCourses > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-900">
                  You have {draftCourses} draft
                  {draftCourses === 1 ? "" : "s"}.
                </p>

                <p className="mt-1 text-xs text-amber-800">
                  Review the course content before publishing.
                </p>
              </div>
            )}

            <Button
              className="w-full"
              variant="outline"
              onClick={() => navigate("/admin/course")}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Courses
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Course performance */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Course Performance</CardTitle>

            <CardDescription className="mt-1">
              Compare enrollment, completed sales, revenue, and ratings. Sales
              and revenue use the selected period.
            </CardDescription>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/admin/course")}
          >
            Manage Courses
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          {coursePerformance.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground" />

              <h3 className="mt-3 font-semibold">No courses created yet</h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Create your first course to start building your teaching
                business.
              </p>

              <Button
                className="mt-4"
                onClick={() => navigate("/admin/course/create")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[240px]">Course</TableHead>

                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Enrolled</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {coursePerformance.map((course) => (
                    <TableRow key={course.courseId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt=""
                              className="h-12 w-16 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-muted">
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}

                          <span className="max-w-[220px] truncate font-medium">
                            {course.title}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="whitespace-nowrap text-sm text-muted-foreground">
                          {course.category}
                        </span>
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        {formatNumber(course.enrolledStudents)}
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        {formatNumber(course.sales)}
                      </TableCell>

                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(course.revenue)}
                      </TableCell>

                      <TableCell className="text-right">
                        {course.totalReviews > 0 ? (
                          <span className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {Number(course.averageRating).toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={course.isPublished ? "default" : "secondary"}
                        >
                          {course.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent sales and quick actions */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Sales</CardTitle>

            <CardDescription>
              Latest completed purchases in {RANGE_LABELS[range].toLowerCase()}.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {recentSales.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <ShoppingCart className="h-9 w-9 text-muted-foreground" />

                <p className="mt-3 font-medium">No completed sales yet</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Your latest purchases will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {recentSales.map((sale) => (
                  <div
                    key={sale.purchaseId}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {sale.student?.photoUrl ? (
                        <img
                          src={sale.student.photoUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                          {getInitials(sale.student?.name)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {sale.student?.name || "Student"}
                        </p>

                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {sale.course?.title || "Course"}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatSaleDate(sale.purchasedAt)}
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 font-semibold tabular-nums">
                      {formatCurrency(sale.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>

            <CardDescription>Jump straight to your next task.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <button
              type="button"
              onClick={() => navigate("/admin/course/create")}
              className="group flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Plus className="h-5 w-5" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  Create a course
                </span>

                <span className="mt-1 block text-xs text-muted-foreground">
                  Add course information and curriculum.
                </span>
              </span>

              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/course")}
              className="group flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <BookOpen className="h-5 w-5" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  Manage courses
                </span>

                <span className="mt-1 block text-xs text-muted-foreground">
                  Edit content, lectures, and publishing status.
                </span>
              </span>

              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>

            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />

                <p className="text-sm font-semibold">Keep growing</p>
              </div>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Keep your published course content updated and review student
                feedback to improve the learning experience.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Analytics include completed purchases for your current courses.
      </p>
    </div>
  );
};

export default Dashboard;
