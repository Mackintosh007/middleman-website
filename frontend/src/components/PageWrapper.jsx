function PageWrapper({ children }) {
  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      {children}
    </main>
  );
}

export default PageWrapper;
