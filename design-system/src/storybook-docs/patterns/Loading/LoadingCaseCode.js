/** The source shown behind Show code for each live example in LoadingCases.jsx. */

export const CODE = {
    SkeletonInShape: `<Section
    title="Students"
    description="Lincoln Middle"
    views={<ViewPills views={['All students']} />}
    search={<HeaderSearch />}
>
    <LoadThenReveal
        as="section"
        aria-label="Students"
        loading
        skeleton={() => <SkeletonRows />}
    >
        <StudentsTable count={4} sortable />
    </LoadThenReveal>
</Section>`,
    SpinnerInBlank: `<Section title="Students" description="Lincoln Middle">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minBlockSize: 'calc(var(--control-lg) * 4)' }}>
        <Spinner size={24} label="Loading students" />
    </div>
</Section>`,
};
