/* eslint-disable @typescript-eslint/no-unused-expressions */
import React from 'react';
import styled, { CSSObject } from '@emotion/styled';
import classnames from 'classnames';
import { SubMenuContent } from './SubMenuContent';
import { useSidebar } from '../hooks/useSidebar';
import { StyledMenuLabel } from '../styles/StyledMenuLabel';
import { StyledMenuIcon } from '../styles/StyledMenuIcon';
import { StyledMenuPrefix } from '../styles/StyledMenuPrefix';
import { MenuItemProps } from './MenuItem';
import { useMenu } from '../hooks/useMenu';
import { StyledMenuSuffix } from '../styles/StyledMenuSuffix';
import { menuClasses } from '../utils/utilityClasses';
import {
  StyledExpandIcon,
  StyledExpandIconCollapsed,
  StyledExpandIconWrapper,
} from '../styles/StyledExpandIcon';
import { usePopper } from '../hooks/usePopper';
import { MenuButton, menuButtonStyles } from './MenuButton';
import { SidebarContext } from './Sidebar';

export interface SubMenuProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'prefix'> {
  /**
   * The label to be displayed in the menu item
   */
  label?: string | React.ReactNode;

  /**
   * The icon to be displayed in the menu item
   */
  icon?: React.ReactNode;

  /**
   * The prefix to be displayed in the menu item
   */
  prefix?: React.ReactNode;

  /**
   * The suffix to be displayed in the menu item
   */
  suffix?: React.ReactNode;

  /**
   * set open value to control the open state of the sub menu
   */
  open?: boolean;

  /**
   * set defaultOpen value to set the initial open state of the sub menu
   */
  defaultOpen?: boolean;

  /**
   * If set to true, the menu item will have an active state
   */
  active?: boolean;

  /**
   * If set to true, the menu item will be disabled
   */
  disabled?: boolean;

  /**
   * The component to be rendered as the menu item button
   */
  component?: string | React.ReactElement;

  /**
   * Apply styles from the root element
   */
  rootStyles?: CSSObject;

  /**
   * callback function to be called when the open state of the sub menu changes
   * @param open
   */
  onOpenChange?: (open: boolean) => void;

  children?: React.ReactNode;

  /**
   * The level is passed down automatically from the parent component
   * @ignore
   */
  level?: number;
}

interface StyledSubMenuProps extends Pick<SubMenuProps, 'rootStyles' | 'active' | 'disabled'> {
  level: number;
  menuItemStyles?: CSSObject;
  collapsed?: boolean;
  rtl?: boolean;
  buttonStyles?: CSSObject;
}

type MenuItemElement =
  | 'root'
  | 'button'
  | 'label'
  | 'prefix'
  | 'suffix'
  | 'icon'
  | 'subMenuContent'
  | 'SubMenuExpandIcon';

const StyledSubMenu = styled.li<StyledSubMenuProps>`
  position: relative;
  width: 100%;

  ${({ menuItemStyles }) => menuItemStyles};

  ${({ rootStyles }) => rootStyles};

  > .${menuClasses.button} {
    ${({ level, disabled, active, collapsed, rtl }) =>
      menuButtonStyles({
        level,
        disabled,
        active,
        collapsed,
        rtl,
      })};

    ${({ buttonStyles }) => buttonStyles};
  }
`;

export const SubMenuFR: React.ForwardRefRenderFunction<HTMLLIElement, SubMenuProps> = (
  {
    children,
    className,
    label,
    icon,
    title,
    prefix,
    suffix,
    open: openSubmenu,
    defaultOpen,
    level = 0,
    active = false,
    disabled = false,
    rootStyles,
    component,
    onOpenChange,
    onClick,
    onKeyUp,
    ...rest
  },
  ref,
) => {
  const { collapsed, rtl } = React.useContext(SidebarContext);
  const { transitionDuration } = useSidebar();
  const { renderExpandIcon, closeOnClick, menuItemStyles } = useMenu();

  const [open, setOpen] = React.useState<boolean>(!!defaultOpen);
  const [openWhenCollapsed, setOpenWhenCollapsed] = React.useState<boolean>(false);

  // TODO: this state is not necessary
  const [openDefault, setOpenDefault] = React.useState<boolean>(!!defaultOpen);

  const childNodes = React.Children.toArray(children).filter(Boolean) as [
    React.ReactElement<SubMenuProps | MenuItemProps>,
  ];

  const buttonRef = React.useRef<HTMLAnchorElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();

  const { popperInstance } = usePopper({
    level,
    buttonRef,
    contentRef,
  });

  const slideUp = () => {
    const target = contentRef.current;
    if (target) {
      target.style.display = 'block';
      target.style.overflow = 'hidden';
      target.style.height = 'auto';
      const height = target.offsetHeight;
      target.style.height = '0px';
      target.offsetHeight;
      target.style.height = `${height}px`;

      timer.current = setTimeout(() => {
        target.style.overflow = 'auto';
        target.style.height = 'auto';
      }, transitionDuration);
    }
  };

  const slideDown = () => {
    const target = contentRef.current;
    if (target) {
      target.style.overflow = 'hidden';
      target.style.height = `${target.offsetHeight}px`;
      target.offsetHeight;
      target.style.height = '0px';

      timer.current = setTimeout(() => {
        target.style.overflow = 'auto';
        target.style.display = 'none';
      }, transitionDuration);
    }
  };

  const handleSlideToggle = (): void => {
    if (typeof openSubmenu === 'undefined' && !(level === 0 && collapsed)) {
      onOpenChange?.(!open);
      setOpen(!open);
      open ? slideDown() : slideUp();
    } else {
      onOpenChange?.(!openSubmenu);
    }
  };

  const handleOnClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    onClick?.(event);
    handleSlideToggle();
  };

  const handleOnKeyUp = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    onKeyUp?.(event);
    if (event.key === 'Enter') {
      handleSlideToggle();
    }
  };

  const getSubMenuItemStyles = (element: MenuItemElement): CSSObject | undefined => {
    if (menuItemStyles) {
      const params = { level, disabled, active, isSubmenu: true, open: openSubmenu ?? open };
      const {
        root: rootElStyles,
        button: buttonElStyles,
        label: labelElStyles,
        icon: iconElStyles,
        prefix: prefixElStyles,
        suffix: suffixElStyles,
        subMenuContent: subMenuContentElStyles,
        SubMenuExpandIcon: SubMenuExpandIconElStyles,
      } = menuItemStyles;

      switch (element) {
        case 'root':
          return typeof rootElStyles === 'function' ? rootElStyles(params) : rootElStyles;

        case 'button':
          return typeof buttonElStyles === 'function' ? buttonElStyles(params) : buttonElStyles;

        case 'label':
          return typeof labelElStyles === 'function' ? labelElStyles(params) : labelElStyles;

        case 'icon':
          return typeof iconElStyles === 'function' ? iconElStyles(params) : iconElStyles;

        case 'prefix':
          return typeof prefixElStyles === 'function' ? prefixElStyles(params) : prefixElStyles;

        case 'suffix':
          return typeof suffixElStyles === 'function' ? suffixElStyles(params) : suffixElStyles;

        case 'SubMenuExpandIcon':
          return typeof SubMenuExpandIconElStyles === 'function'
            ? SubMenuExpandIconElStyles(params)
            : SubMenuExpandIconElStyles;

        case 'subMenuContent':
          return typeof subMenuContentElStyles === 'function'
            ? subMenuContentElStyles(params)
            : subMenuContentElStyles;

        default:
          return undefined;
      }
    }
  };

  React.useEffect(() => {
    setTimeout(() => popperInstance?.update(), transitionDuration);
    if (collapsed && level === 0) {
      setOpenWhenCollapsed(false);
      // ? if its useful to close first level submenus on collapse sidebar uncomment the code below
      // setOpen(false);
    }
  }, [collapsed, level, rtl, transitionDuration, popperInstance]);

  React.useEffect(() => {
    const handleTogglePopper = (target: Node) => {
      if (!openWhenCollapsed && buttonRef.current?.contains(target)) setOpenWhenCollapsed(true);
      else if (
        (closeOnClick &&
          !(target as HTMLElement)
            .closest(`.${menuClasses.menuItemRoot}`)
            ?.classList.contains(menuClasses.subMenuRoot)) ||
        (!contentRef.current?.contains(target) && openWhenCollapsed)
      ) {
        setOpenWhenCollapsed(false);
      }
    };

    const handleDocumentClick = (event: MouseEvent) => {
      handleTogglePopper(event.target as Node);
    };

    const handleDocumentKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleTogglePopper(event.target as Node);
      } else if (event.key === 'Escape') {
        setOpenWhenCollapsed(false);
      }
    };

    const removeEventListeners = () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keyup', handleDocumentKeyUp);
    };

    removeEventListeners();

    if (collapsed && level === 0) {
      document.addEventListener('click', handleDocumentClick, false);
      document.addEventListener('keyup', handleDocumentKeyUp, false);
    }

    return () => {
      removeEventListeners();
    };
  }, [collapsed, level, closeOnClick, openWhenCollapsed]);

  // TODO: this needs to be refactored, we don't need to use state for this
  React.useEffect(() => {
    if (openSubmenu) setOpenDefault(openSubmenu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sharedClasses = {
    [menuClasses.active]: active,
    [menuClasses.disabled]: disabled,
    [menuClasses.open]: openSubmenu ?? open,
  };

  return (
    <StyledSubMenu
      ref={ref}
      className={classnames(
        menuClasses.menuItemRoot,
        menuClasses.subMenuRoot,
        sharedClasses,
        className,
      )}
      menuItemStyles={getSubMenuItemStyles('root')}
      level={level}
      collapsed={collapsed}
      rtl={rtl}
      disabled={disabled}
      active={active}
      buttonStyles={getSubMenuItemStyles('button')}
      rootStyles={rootStyles}
    >
      <MenuButton
        data-testid={`${menuClasses.button}-test-id`}
        ref={buttonRef}
        title={title}
        className={classnames(menuClasses.button, sharedClasses)}
        onClick={handleOnClick}
        onKeyUp={handleOnKeyUp}
        component={component}
        tabIndex={0}
        {...rest}
      >
        {icon && (
          <StyledMenuIcon
            rtl={rtl}
            className={classnames(menuClasses.icon, sharedClasses)}
            rootStyles={getSubMenuItemStyles('icon')}
          >
            {icon}
          </StyledMenuIcon>
        )}

        {prefix && (
          <StyledMenuPrefix
            collapsed={collapsed}
            transitionDuration={transitionDuration}
            firstLevel={level === 0}
            className={classnames(menuClasses.prefix, sharedClasses)}
            rtl={rtl}
            rootStyles={getSubMenuItemStyles('prefix')}
          >
            {prefix}
          </StyledMenuPrefix>
        )}

        <StyledMenuLabel
          className={classnames(menuClasses.label, sharedClasses)}
          rootStyles={getSubMenuItemStyles('label')}
        >
          {label}
        </StyledMenuLabel>

        {suffix && (
          <StyledMenuSuffix
            collapsed={collapsed}
            transitionDuration={transitionDuration}
            firstLevel={level === 0}
            className={classnames(menuClasses.suffix, sharedClasses)}
            rootStyles={getSubMenuItemStyles('suffix')}
          >
            {suffix}
          </StyledMenuSuffix>
        )}

        <StyledExpandIconWrapper
          rtl={rtl}
          className={classnames(menuClasses.SubMenuExpandIcon, sharedClasses)}
          collapsed={collapsed}
          level={level}
          rootStyles={getSubMenuItemStyles('SubMenuExpandIcon')}
        >
          {renderExpandIcon ? (
            renderExpandIcon({
              level,
              disabled,
              active,
              open: openSubmenu ?? open,
            })
          ) : collapsed && level === 0 ? (
            <StyledExpandIconCollapsed />
          ) : (
            <StyledExpandIcon rtl={rtl} open={openSubmenu ?? open} />
          )}
        </StyledExpandIconWrapper>
      </MenuButton>

      <SubMenuContent
        ref={contentRef}
        openWhenCollapsed={openWhenCollapsed}
        open={openSubmenu ?? open}
        firstLevel={level === 0}
        collapsed={collapsed}
        defaultOpen={openDefault}
        className={classnames(menuClasses.subMenuContent, sharedClasses)}
        rootStyles={getSubMenuItemStyles('subMenuContent')}
      >
        {/* TODO: use context to pass down level to the tree */}
        {childNodes.map((node) =>
          React.cloneElement(node, {
            ...node.props,
            level: level + 1,
          }),
        )}
      </SubMenuContent>
    </StyledSubMenu>
  );
};
export const SubMenu = React.forwardRef<HTMLLIElement, SubMenuProps>(SubMenuFR);
