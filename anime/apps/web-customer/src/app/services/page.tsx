import React from "react";
import { getServices } from "@/lib/actions";
import { ServiceCard } from "@/components/ServiceCard";
import { ServiceCategoryFilter } from "@/components/ServiceCategoryFilter";
import type { ServiceCategory } from "@shram-sangam/shared-types";

const CATEGORIES: ServiceCategory[] = [
  "Plumbing", "Electrical", "Carpentry",
  "Caregiving", "Cleaning", "Appliance Repair", "Painting", "Other",
];

interface Props {
  searchParams: { category?: string };
}

export default async function ServicesPage({ searchParams }: Props) {
  const services = await getServices();
  const activeCategory = searchParams.category as ServiceCategory | undefined;

  const filtered = activeCategory
    ? services.filter((s) => s.category === activeCategory)
    : services;

  return (
    <div className="space-y-5 py-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Find a Service</h1>
        <p className="text-sm text-slate-500 mt-1">
          {services.length} services available from verified co-op members
        </p>
      </div>

      <ServiceCategoryFilter categories={CATEGORIES} active={activeCategory} />

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No services found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
