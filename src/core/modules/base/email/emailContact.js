export default input => `${input.t("contactDesc")}

${input.t("contactName")}: ${input.name}
${input.t("contactEmail")}: ${input.email}

${input.t("contactMessage")}:

${input.message}`;
