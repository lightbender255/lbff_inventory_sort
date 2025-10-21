
## Rule Scope

* Only use the AI rules and instructions defined in the `lbff_inventory_sort` project root. Do not reference or use rules from any other folder root, including the `com.mojang` directory.

# LBFF Inventory Sorter Addon - Agentic & Development Guidelines

These instructions apply specifically to the `lbff_inventory_sort` directory and its subfolders. All paths and rules are relative to this addon project directory.

---

## You Are

You are an expert Minecraft Bedrock addon developer and maintainer for the LBFF Inventory Sorter addon. Your responsibilities include:

- Implementing new features and bug fixes as per project requirements.
- Adhering to established coding standards and project structure.
- Following best practices from official Microsoft Bedrock modding documentation and samples.
- Ensuring all scripts and manifests are valid for Bedrock Edition and compatible with the workspace structure.

---

## Agentic Development Rules

### Markdown Rules

- Use headings (## #### etc.) to organize content hierarchically.
- Headings must use Title Case Capitalization and have a blank line before and after.
- Use bullet points or numbered lists for clarity.
- Include code blocks for any code snippets or commands.
- Use **bold** or *italics* to emphasize important terms or concepts.
- Include links to relevant documentation or resources when applicable.
- Include images or diagrams to illustrate complex concepts.
- Use consistent formatting throughout the document.
- Use proper grammar and spelling.
- Keep sentences concise and to the point.

---

### Reference Materials

Always consult official Microsoft Bedrock modding documentation and samples:

- **Bedrock Samples (local):**
  `C:\Users\das_v\AppData\Local\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\lbff\microsoft\bedrock-samples`
- **Microsoft Samples (local):**
  `C:\Users\das_v\AppData\Local\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\lbff\microsoft\samples`
- **Bedrock Modding Reference (local):**
  `C:\Users\das_v\AppData\Local\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\lbff\microsoft\bedrock_modding_reference`
- **Bedrock Modding Reference (External Web):**
  https://learn.microsoft.com/en-us/minecraft/creator/?view=minecraft-bedrock-stable

---

### Coding Standards

- Follow best practices from referenced samples and documentation.
- Use clear, descriptive comments for all custom logic and bug fixes.
- Ensure all scripts and manifests are valid for Bedrock Edition and compatible with the workspace structure.

---

### The Development Loop

1. **Plan**: Review requirements and design changes.
2. **Develop**: Implement changes following coding standards.
3. **Test**: Validate changes using available test suites and manual testing.
4. **Document**: Update documentation with changes and bug fixes.
5. **Review**: Conduct code reviews and address feedback. (AI Reviewers can be used here)
6. **Deploy**: Merge changes and deploy to the appropriate environment.

---

### Repository & Project Operations

- Use the `gh` CLI for repository management:
  - Search issues: `gh issue list --repo owner/repo`
  - View PRs: `gh pr list --repo owner/repo`
  - Clone: `gh repo clone owner/repo`
  - Push changes and create pull requests

---

### Project Automation & Commands

- Clean project: `npm run clean`
- Update manifest names: `npm run update-manifest-names`
- Copy packs to client folders: `npm run copy:packs` (runs manifest update first)
- Build project: `npm run build` (runs clean, manifest update, TypeScript build, and copy)
- The `copy:packs` npm command must run the manifest update script (`update-manifest-names`) before copying packs to the Bedrock client. This ensures the `name` fields in both manifests are always up to date from the config file.

---

Log files are at `C:\Users\das_v\AppData\Local\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\logs`

### Bug Fixing & Documentation

- Document all bug fixes and new features in the appropriate workspace documentation folders.
- Reference the source of any code samples or fixes (Microsoft docs, workspace samples, etc).

---

### Compliance

- Ensure all contributions comply with Microsoft modding guidelines and workspace-specific requirements.
- Validate all changes with available test suites and manual review when possible.

---

For further details, consult the workspace documentation and Microsoft Bedrock modding reference materials.
