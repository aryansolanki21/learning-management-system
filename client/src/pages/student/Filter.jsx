import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Filter as FilterIcon, X } from "lucide-react";

const categories = [
  { id: "Next JS", label: "Next JS" },
  { id: "Data Science", label: "Data Science" },
  { id: "Frontend Development", label: "Frontend Development" },
  { id: "Fullstack Development", label: "Fullstack Development" },
  { id: "MERN Stack Development", label: "MERN Stack Development" },
  { id: "Backend Development", label: "Backend Development" },
  { id: "Javascript", label: "Javascript" },
  { id: "Python", label: "Python" },
  { id: "Docker", label: "Docker" },
  { id: "MongoDB", label: "MongoDB" },
  { id: "HTML", label: "HTML" },
];

const Filter = ({
  selectedCategories,
  sortByPrice,
  handleFilterChange,
  clearFilters,
  resultCount,
}) => {
  const handleCategoryChange = (categoryId) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];

    handleFilterChange(newCategories, sortByPrice);
  };

  const selectByPriceHandler = (selectedValue) => {
    handleFilterChange(selectedCategories, selectedValue);
  };

  const activeFilterCount = selectedCategories.length + (sortByPrice ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Desktop / mobile filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          {/* Filter & Sort Sheet */}
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" className="h-10 rounded-lg gap-2">
                  <FilterIcon size={17} />
                  Filter & Sort
                  {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-xs">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              }
            />

            <SheetContent
              side="right"
              className="w-full sm:max-w-md p-0 flex flex-col"
            >
              <SheetHeader className="border-b px-6 py-5">
                <SheetTitle className="text-xl">Filter & Sort</SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                {/* Sort */}
                <div className="mb-8">
                  <h3 className="font-semibold text-base mb-4">Sort by</h3>

                  <Select
                    value={sortByPrice}
                    onValueChange={selectByPriceHandler}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Recommended" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Price</SelectLabel>

                        <SelectItem value="low">Price: Low to High</SelectItem>

                        <SelectItem value="high">Price: High to Low</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-base">Category</h3>

                    {selectedCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleFilterChange([], sortByPrice)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {categories.map((category) => {
                      const checkboxId = `category-${category.id
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`;

                      return (
                        <div
                          key={category.id}
                          className="flex items-center gap-3"
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={selectedCategories.includes(category.id)}
                            onCheckedChange={() =>
                              handleCategoryChange(category.id)
                            }
                          />

                          <label
                            htmlFor={checkboxId}
                            className="text-sm text-gray-700 cursor-pointer"
                          >
                            {category.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom actions */}
              <SheetFooter className="border-t px-6 py-4 flex flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  className="flex-1"
                >
                  Clear all
                </Button>

                <SheetClose
                  render={
                    <Button type="button" className="flex-1">
                      View {resultCount}{" "}
                      {resultCount === 1 ? "course" : "courses"}
                    </Button>
                  }
                />
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Quick category indicator */}
          {selectedCategories.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              {selectedCategories.slice(0, 2).map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                >
                  {category}

                  <button
                    type="button"
                    onClick={() => handleCategoryChange(category)}
                    className="hover:text-blue-900"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}

              {selectedCategories.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{selectedCategories.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Desktop sort shortcut */}
        <div className="hidden md:block">
          <Select value={sortByPrice} onValueChange={selectByPriceHandler}>
            <SelectTrigger className="w-44 h-10 rounded-lg">
              <SelectValue placeholder="Sort: Recommended" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectLabel>Sort by price</SelectLabel>

                <SelectItem value="low">Price: Low to High</SelectItem>

                <SelectItem value="high">Price: High to Low</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default Filter;
