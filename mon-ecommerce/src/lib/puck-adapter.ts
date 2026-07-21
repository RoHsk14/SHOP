import type { Data } from "@puckeditor/core";
import type { SectionSetting, BlockSetting } from "./theme-config";
import { getSectionDefinition } from "./sections";

export function sectionsToPuckData(sections: SectionSetting[]): Data {
  const content: Data["content"] = sections
    .map((section) => {
      const def = getSectionDefinition(section.type);
      if (!def) return null;

      const props: Record<string, any> = { id: section.id, _disabled: section.disabled, ...section.settings };

      if (def.blocks && section.blocks) {
        if (def.blocks.length === 1) {
          const blockKey = `${def.blocks[0].type}s`;
          props[blockKey] = section.blocks.map((b) => ({ id: b.id, ...b.settings }));
        } else {
          for (const bd of def.blocks) {
            const blockKey = `${bd.type}_blocks`;
            props[blockKey] = section.blocks
              .filter((b) => b.type === bd.type)
              .map((b) => ({ id: b.id, ...b.settings }));
          }
        }
      }

      return {
        type: section.type,
        props,
      };
    })
    .filter(Boolean) as Data["content"];

  return {
    root: { props: { title: "" } },
    content,
  };
}

function hasBlocks(sectionType: string): boolean {
  const def = getSectionDefinition(sectionType);
  return !!(def?.blocks && def.blocks.length > 0);
}

export function puckDataToSections(
  data: Data,
  existingSections: SectionSetting[]
): SectionSetting[] {
  const disabledIds = new Set(
    existingSections.filter((s) => s.disabled).map((s) => s.id)
  );

  let blockCounter = 0;

  return data.content.map((item) => {
    const type = item.type as string;
    const props = item.props as Record<string, any>;

    const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const sectionId = props.id || `${type}-${uid}`;
    const { id: _id, _disabled, ...rest } = props;

    const settings: Record<string, any> = {};
    const blocks: BlockSetting[] = [];

    if (hasBlocks(type)) {
      const def = getSectionDefinition(type);
      if (def?.blocks) {
        if (def.blocks.length === 1) {
          const blockKey = `${def.blocks[0].type}s`;
          const items = rest[blockKey] || [];
          items.forEach((item: any) => {
            const { id: _bid, ...blockSettings } = item;
            blocks.push({
              id: _bid || `block-${Date.now()}-${blockCounter++}`,
              type: def.blocks![0].type,
              settings: blockSettings,
            });
          });
          for (const key of Object.keys(rest)) {
            if (key !== blockKey) settings[key] = rest[key];
          }
        } else {
          for (const bd of def.blocks) {
            const blockKey = `${bd.type}_blocks`;
            const items = rest[blockKey] || [];
            items.forEach((item: any) => {
              const { id: _bid, ...blockSettings } = item;
              blocks.push({
                id: _bid || `block-${Date.now()}-${blockCounter++}`,
                type: bd.type,
                settings: blockSettings,
              });
            });
          }
          for (const key of Object.keys(rest)) {
            if (!key.endsWith("_blocks")) settings[key] = rest[key];
          }
        }
      }
    } else {
      Object.assign(settings, rest);
    }

    return {
      id: sectionId,
      type,
      settings,
      blocks: blocks.length > 0 ? blocks : undefined,
      disabled: disabledIds.has(sectionId),
    };
  });
}
