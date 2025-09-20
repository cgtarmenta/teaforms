import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '../../../src/components/AppButton.vue'

describe('AppButton', () => {
  describe('Rendering', () => {
    it('should render button with default props', () => {
      const wrapper = mount(AppButton)
      expect(wrapper.find('button').exists()).toBe(true)
      expect(wrapper.classes()).toContain('bg-primary-600')
    })

    it('should render label text', () => {
      const wrapper = mount(AppButton, {
        props: {
          label: 'Click me'
        }
      })
      expect(wrapper.text()).toContain('Click me')
    })

    it('should render slot content', () => {
      const wrapper = mount(AppButton, {
        slots: {
          default: 'Slot content'
        }
      })
      expect(wrapper.text()).toContain('Slot content')
    })
  })

  describe('Variants', () => {
    it('should apply primary variant classes', () => {
      const wrapper = mount(AppButton, {
        props: { variant: 'primary' }
      })
      expect(wrapper.classes()).toContain('bg-primary-600')
    })

    it('should apply secondary variant classes', () => {
      const wrapper = mount(AppButton, {
        props: { variant: 'secondary' }
      })
      expect(wrapper.classes()).toContain('bg-secondary-600')
    })

    it('should apply outline variant classes', () => {
      const wrapper = mount(AppButton, {
        props: { variant: 'outline' }
      })
      expect(wrapper.classes()).toContain('border-2')
      expect(wrapper.classes()).toContain('border-gray-300')
    })

    it('should apply danger variant classes', () => {
      const wrapper = mount(AppButton, {
        props: { variant: 'danger' }
      })
      expect(wrapper.classes()).toContain('bg-red-600')
    })
  })

  describe('Sizes', () => {
    it('should apply correct size classes', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const
      const expectedClasses = {
        xs: 'px-2.5',
        sm: 'px-3',
        md: 'px-4',
        lg: 'px-4',
        xl: 'px-6'
      }

      sizes.forEach(size => {
        const wrapper = mount(AppButton, {
          props: { size }
        })
        expect(wrapper.classes().join(' ')).toContain(expectedClasses[size])
      })
    })
  })

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      const wrapper = mount(AppButton, {
        props: { disabled: true }
      })
      const button = wrapper.find('button')
      expect(button.attributes('disabled')).toBeDefined()
      expect(wrapper.classes()).toContain('disabled:opacity-50')
    })

    it('should show loading spinner when loading', () => {
      const wrapper = mount(AppButton, {
        props: { loading: true }
      })
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })

    it('should apply full width classes', () => {
      const wrapper = mount(AppButton, {
        props: { fullWidth: true }
      })
      expect(wrapper.classes()).toContain('w-full')
    })
  })

  describe('Interactions', () => {
    it('should emit click event when clicked', async () => {
      const wrapper = mount(AppButton)
      await wrapper.trigger('click')
      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')).toHaveLength(1)
    })

    it('should not emit click when disabled', async () => {
      const wrapper = mount(AppButton, {
        props: { disabled: true }
      })
      await wrapper.trigger('click')
      expect(wrapper.emitted('click')).toBeFalsy()
    })

    it('should not emit click when loading', async () => {
      const wrapper = mount(AppButton, {
        props: { loading: true }
      })
      await wrapper.trigger('click')
      expect(wrapper.emitted('click')).toBeFalsy()
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label when provided', () => {
      const wrapper = mount(AppButton, {
        props: { ariaLabel: 'Submit form' }
      })
      expect(wrapper.find('button').attributes('aria-label')).toBe('Submit form')
    })

    it('should have aria-pressed when provided', () => {
      const wrapper = mount(AppButton, {
        props: { pressed: true }
      })
      expect(wrapper.find('button').attributes('aria-pressed')).toBe('true')
    })

    it('should have aria-expanded when provided', () => {
      const wrapper = mount(AppButton, {
        props: { expanded: false }
      })
      expect(wrapper.find('button').attributes('aria-expanded')).toBe('false')
    })

    it('should have minimum touch target size', () => {
      const wrapper = mount(AppButton)
      expect(wrapper.classes()).toContain('touch-target')
    })
  })

  describe('Icon support', () => {
    it('should hide text when iconOnly is true', () => {
      const wrapper = mount(AppButton, {
        props: { 
          iconOnly: true,
          label: 'Hidden text'
        }
      })
      expect(wrapper.find('.sr-only').exists()).toBe(true)
    })
  })
})