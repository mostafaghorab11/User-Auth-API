function handleValidationError(error) {
  if (error.name !== "ValidationError") {
    throw error; // Re-throw non-validation errors
  }

  const validationErrors = Object.values(error.errors).map((err) => {
    return err.message || `${err.path} is required`; // Use default message for missing message property
  });

  return { error: validationErrors };
}

module.exports = handleValidationError;
