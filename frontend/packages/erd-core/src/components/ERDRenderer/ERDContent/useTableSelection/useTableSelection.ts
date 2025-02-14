import { useCustomReactflow } from '@/features/reactflow/hooks'
import { updateActiveTableName } from '@/stores'
import { useCallback } from 'react'
import { highlightNodesAndEdges } from '../highlightNodesAndEdges'

type SelectTableParams = {
  tableId: string
  shouldFitViewToActiveTable: boolean
}

export const useTableSelection = () => {
  const { getNodes, getEdges, setNodes, setEdges, fitView } =
    useCustomReactflow()

  const selectTable = useCallback(
    ({ tableId, shouldFitViewToActiveTable }: SelectTableParams) => {
      updateActiveTableName(tableId)

      const { nodes, edges } = highlightNodesAndEdges(getNodes(), getEdges(), {
        activeTableName: tableId,
      })

      setNodes(nodes)
      setEdges(edges)

      if (shouldFitViewToActiveTable) {
        fitView({
          maxZoom: 1,
          duration: 300,
          nodes: [{ id: tableId }],
        })
      }
    },
    [getNodes, getEdges, setNodes, setEdges, fitView],
  )

  const deselectTable = useCallback(() => {
    updateActiveTableName(undefined)

    const { nodes, edges } = highlightNodesAndEdges(getNodes(), getEdges(), {
      activeTableName: undefined,
    })
    setNodes(nodes)
    setEdges(edges)
  }, [getNodes, getEdges, setNodes, setEdges])

  return {
    selectTable,
    deselectTable,
  }
}
