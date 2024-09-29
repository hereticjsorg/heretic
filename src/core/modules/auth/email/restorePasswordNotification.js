export default (input) => `${input.t("restorePasswordMailText")}
${input.t("restorePasswordMailNotice")}

${input.t("restorePasswordMailButton")}: ${input.activationUrl}`;
