import dynamic from "next/dynamic";

const FeaturesSectionDemo = dynamic(() => import("@/components/features-section-demo-1").then(mod => mod.default) , {
  loading: () => <div>Loading...</div>
});

export const FeaturesA = () => {
  return <FeaturesSectionDemo />;
};