/**
 * Test: [HookName] Hook
 *
 * Spec: [spec-id]
 * Task: [task-id]
 *
 * Tests [HookName] custom React hook following TDD principles.
 * Coverage target: 70%+
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { [HookName] } from './[HookName]';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  [apiFunction]: jest.fn(),
}));

import { [apiFunction] } from '@/lib/api';

describe('[HookName] Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should return initial state', () => {
      // Arrange & Act
      const { result } = renderHook(() => [HookName]());

      // Assert
      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should accept initial value', () => {
      // Arrange
      const initialValue = 'initial';

      // Act
      const { result } = renderHook(() => [HookName](initialValue));

      // Assert
      expect(result.current.value).toBe(initialValue);
    });
  });

  describe('State Updates', () => {
    it('should update state when action is called', () => {
      // Arrange
      const { result } = renderHook(() => [HookName]());

      // Act
      act(() => {
        result.current.setValue('new value');
      });

      // Assert
      expect(result.current.value).toBe('new value');
    });

    it('should update multiple state values', () => {
      // Arrange
      const { result } = renderHook(() => [HookName]());

      // Act
      act(() => {
        result.current.setData({ field1: 'value1', field2: 'value2' });
      });

      // Assert
      expect(result.current.data.field1).toBe('value1');
      expect(result.current.data.field2).toBe('value2');
    });

    it('should batch state updates correctly', () => {
      // Arrange
      const { result } = renderHook(() => [HookName]());
      let renderCount = 0;

      // Track renders
      const { rerender } = renderHook(() => {
        renderCount++;
        return [HookName]();
      });

      // Act
      act(() => {
        result.current.setValue1('value1');
        result.current.setValue2('value2');
        result.current.setValue3('value3');
      });

      // Assert - Should batch and only render once
      expect(renderCount).toBe(2); // Initial + batch update
    });
  });

  describe('Side Effects', () => {
    it('should trigger effect on mount', async () => {
      // Arrange
      const mockData = [{ id: '1', name: 'Item 1' }];
      ([apiFunction] as jest.Mock).mockResolvedValue(mockData);

      // Act
      const { result } = renderHook(() => [HookName]());

      // Assert
      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });
      expect([apiFunction]).toHaveBeenCalledTimes(1);
    });

    it('should trigger effect when dependency changes', async () => {
      // Arrange
      const mockData = [{ id: '1', name: 'Item 1' }];
      ([apiFunction] as jest.Mock).mockResolvedValue(mockData);

      const { result, rerender } = renderHook(
        ({ id }) => [HookName](id),
        { initialProps: { id: '1' } }
      );

      // Act - Change dependency
      rerender({ id: '2' });

      // Assert
      await waitFor(() => {
        expect([apiFunction]).toHaveBeenCalledTimes(2);
      });
    });

    it('should cleanup effect on unmount', () => {
      // Arrange
      const cleanup = jest.fn();
      jest.spyOn(React, 'useEffect').mockImplementation((effect) => {
        effect();
        return cleanup;
      });

      const { unmount } = renderHook(() => [HookName]());

      // Act
      unmount();

      // Assert
      expect(cleanup).toHaveBeenCalled();
    });
  });

  describe('Async Operations', () => {
    it('should set loading state during async operation', async () => {
      // Arrange
      ([apiFunction] as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      // Act
      const { result } = renderHook(() => [HookName]());

      // Assert - Initially loading
      expect(result.current.isLoading).toBe(true);

      // Assert - Loading complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle successful async operation', async () => {
      // Arrange
      const mockData = [{ id: '1', name: 'Item 1' }];
      ([apiFunction] as jest.Mock).mockResolvedValue(mockData);

      // Act
      const { result } = renderHook(() => [HookName]());

      await act(async () => {
        await result.current.fetchData();
      });

      // Assert
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });

    it('should handle async operation error', async () => {
      // Arrange
      const error = new Error('API Error');
      ([apiFunction] as jest.Mock).mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => [HookName]());

      await act(async () => {
        await result.current.fetchData();
      });

      // Assert
      expect(result.current.data).toBeNull();
      expect(result.current.error).toEqual(error);
    });

    it('should cancel async operation on unmount', async () => {
      // Arrange
      const abortController = new AbortController();
      ([apiFunction] as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const { result, unmount } = renderHook(() => [HookName]());

      // Act
      act(() => {
        result.current.fetchData();
      });

      unmount();

      // Assert - Operation should be cancelled
      expect(abortController.signal.aborted).toBe(true);
    });
  });

  describe('Memoization', () => {
    it('should memoize computed value', () => {
      // Arrange
      const { result, rerender } = renderHook(() => [HookName]());
      const firstComputed = result.current.computedValue;

      // Act - Rerender without changing dependencies
      rerender();

      // Assert - Should return same reference
      expect(result.current.computedValue).toBe(firstComputed);
    });

    it('should recompute when dependency changes', () => {
      // Arrange
      const { result, rerender } = renderHook(
        ({ value }) => [HookName](value),
        { initialProps: { value: 1 } }
      );
      const firstComputed = result.current.computedValue;

      // Act - Change dependency
      rerender({ value: 2 });

      // Assert - Should recompute
      expect(result.current.computedValue).not.toBe(firstComputed);
    });
  });

  describe('Callbacks', () => {
    it('should provide stable callback reference', () => {
      // Arrange
      const { result, rerender } = renderHook(() => [HookName]());
      const firstCallback = result.current.callback;

      // Act
      rerender();

      // Assert - Reference should be stable
      expect(result.current.callback).toBe(firstCallback);
    });

    it('should call callback with correct arguments', () => {
      // Arrange
      const mockCallback = jest.fn();
      const { result } = renderHook(() => [HookName]({ onComplete: mockCallback }));

      // Act
      act(() => {
        result.current.triggerCallback('arg1', 'arg2');
      });

      // Assert
      expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined value', () => {
      // Arrange & Act
      const { result } = renderHook(() => [HookName](undefined));

      // Assert
      expect(result.current.value).toBeUndefined();
    });

    it('should handle null value', () => {
      // Arrange & Act
      const { result } = renderHook(() => [HookName](null));

      // Assert
      expect(result.current.value).toBeNull();
    });

    it('should handle rapid state updates', () => {
      // Arrange
      const { result } = renderHook(() => [HookName]());

      // Act - Rapid updates
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.setValue(i);
        }
      });

      // Assert
      expect(result.current.value).toBe(99);
    });

    it('should handle concurrent updates correctly', async () => {
      // Arrange
      const { result } = renderHook(() => [HookName]());

      // Act - Trigger concurrent updates
      await act(async () => {
        await Promise.all([
          result.current.updateAsync('value1'),
          result.current.updateAsync('value2'),
          result.current.updateAsync('value3'),
        ]);
      });

      // Assert - Last update should win
      expect(result.current.value).toBe('value3');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input', () => {
      // Arrange
      const { result } = renderHook(() => [HookName]());

      // Act & Assert
      expect(() => {
        act(() => {
          result.current.setValue(null); // Invalid
        });
      }).toThrow('Invalid value');
    });

    it('should reset error state on successful operation', async () => {
      // Arrange
      const { result } = renderHook(() => [HookName]());

      // Trigger error
      ([apiFunction] as jest.Mock).mockRejectedValueOnce(new Error('Error'));
      await act(async () => {
        await result.current.fetchData();
      });

      expect(result.current.error).toBeTruthy();

      // Act - Successful operation
      ([apiFunction] as jest.Mock).mockResolvedValueOnce([]);
      await act(async () => {
        await result.current.fetchData();
      });

      // Assert
      expect(result.current.error).toBeNull();
    });
  });

  describe('Custom Options', () => {
    it('should respect custom debounce time', async () => {
      // Arrange
      jest.useFakeTimers();
      const mockCallback = jest.fn();
      const { result } = renderHook(() =>
        [HookName]({ debounceMs: 500, onChange: mockCallback })
      );

      // Act
      act(() => {
        result.current.setValue('a');
        result.current.setValue('b');
        result.current.setValue('c');
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Assert
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('c');

      jest.useRealTimers();
    });

    it('should respect disabled option', () => {
      // Arrange
      const { result } = renderHook(() => [HookName]({ disabled: true }));

      // Act
      act(() => {
        result.current.setValue('new value');
      });

      // Assert - Should not update when disabled
      expect(result.current.value).toBe('');
    });
  });
});
