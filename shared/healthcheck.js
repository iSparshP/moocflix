const healthCheck = async (serviceName, dependencies) => {
  const status = {
    service: serviceName,
    status: "healthy",
    timestamp: new Date().toISOString(),
    dependencies: {},
  };

  for (const [name, checkFn] of Object.entries(dependencies)) {
    try {
      await checkFn();
      status.dependencies[name] = "healthy";
    } catch (error) {
      status.dependencies[name] = "unhealthy";
      status.status = "unhealthy";
    }
  }

  return status;
};
